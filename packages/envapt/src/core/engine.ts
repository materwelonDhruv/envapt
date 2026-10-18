import { BuiltInConverters, ValueConverter } from '../converters';
import { ENV_KEYS, Environment, firstEnvKeyValue, parseEnvironment } from './Environment';
import { isMissing } from './missing';
import { resolveEffectivePaths } from './paths';
import { cache, state } from './state';
import { TemplateResolver } from '../engine/TemplateResolver';
import { Validator } from '../engine/Validators';
import { debugVerbose, debugWarn } from '../infra/Debug';
import { loadDotenv } from '../infra/Dotenv';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';
import { missingValue, validationFailed } from '../infra/failures';

import type { PrimitiveToken } from '../engine/Validators';
import type { ValidationCode } from '../infra/failures';
import type { StandardSchemaV1 } from '../infra/StandardSchema';
import type {
    AdvancedConverterReturn,
    EnvKeyInput,
    InferConverterReturnType,
    PresentValue,
    RequiredConverter
} from '../types';
import type { EnvapterService } from '../types/Env';

function toKeyList(keyInput: EnvKeyInput): readonly string[] {
    const keys = (Array.isArray(keyInput) ? keyInput : [keyInput]) as readonly string[];

    if (keys.length === 0) {
        throw new EnvaptError(EnvaptErrorCodes.InvalidKeyInput, 'At least one environment key must be provided.');
    }

    if (keys.some((k) => typeof k !== 'string')) {
        throw new EnvaptError(EnvaptErrorCodes.InvalidKeyInput, 'Environment keys must be strings.');
    }

    if (keys.some((k) => k.trim() === '')) {
        throw new EnvaptError(EnvaptErrorCodes.InvalidKeyInput, 'Environment keys cannot be empty strings.');
    }

    return keys;
}

export function resolveKeyInput(keyInput: EnvKeyInput): { key: string; value: string | undefined } {
    const normalizedKeys = toKeyList(keyInput);

    // an empty value falls through to the next key and only comes back when every key is empty
    let firstPresent: { key: string; value: string } | undefined;
    for (const candidate of normalizedKeys) {
        const value = readCached(candidate);
        if (value === undefined) continue;
        if (!isMissing(value)) return { key: candidate, value };
        firstPresent ??= { key: candidate, value };
    }

    return firstPresent ?? { key: normalizedKeys[0] as string, value: undefined };
}

export function findPresent(keyInput: EnvKeyInput): PresentValue | undefined {
    const { key, value } = resolveKeyInput(keyInput);
    if (value === undefined || isMissing(value)) return undefined;
    return { key, value: templateResolver.resolveTemplate(key, value) };
}

export function readRequired(keyInput: EnvKeyInput, field: RequiredConverter | StandardSchemaV1): unknown {
    const present = findPresent(keyInput);
    if (present === undefined) throw missingValue(keyInput);
    return valueOrThrow(EnvaptErrorCodes.InvalidEnvValue, present.key, valueConverter.readSpecField(present, field));
}

export function readSchema(
    keyInput: EnvKeyInput,
    schema: StandardSchemaV1,
    fallback: unknown,
    hasFallback: boolean
): unknown {
    // readPrimitive logs the missing-value warning
    const value = readPrimitive(keyInput, 'string');
    if (value === undefined) {
        if (hasFallback) return fallback;
        throw missingValue(keyInput);
    }
    const { key } = resolveKeyInput(keyInput);
    return valueOrThrow(
        EnvaptErrorCodes.SchemaValidationFailed,
        key,
        valueConverter.readValidated({ key, value }, schema)
    );
}

function valueOrThrow(code: ValidationCode, key: string, outcome: StandardSchemaV1.Result<unknown>): unknown {
    if (outcome.issues !== undefined) throw validationFailed(code, [key], outcome.issues);
    return outcome.value;
}

export function ensureLoaded(): Map<string, unknown> {
    if (!state.cacheBuilt) {
        const source = state.source;
        // the loader writes into this object
        const isolatedEnv: Record<string, string> = { ...source.readVars() };

        let added = new Set<string>();
        if (source.supportsFiles) {
            debugVerbose(`base dir: ${state.baseDir ?? 'working directory'}`);
            const effectivePaths = resolveEffectivePaths();
            debugVerbose(`effective .env paths: ${effectivePaths.length === 0 ? '(none)' : effectivePaths.join(', ')}`);
            added = loadDotenv({
                ...state.userDefinedEnvFileOptions,
                path: effectivePaths,
                processEnv: isolatedEnv,
                readFile: source.readFile.bind(source)
            });
        }
        state.dotenvAddedKeys = added;
        for (const [key, value] of Object.entries(isolatedEnv)) cache.set(key, value);
        debugVerbose(`cache populated: ${cache.size} keys total`);
        // set before mirroring because template expansion reads the cache
        state.cacheBuilt = true;
        if (state.syncProcessEnv) mirrorToProcessEnv();
    }

    return cache;
}

function readCached(key: string): string | undefined {
    const c = ensureLoaded();
    // decorator memoization also stores non-string values in this shared cache
    if (c.has(key)) {
        const cached = c.get(key);
        return typeof cached === 'string' ? cached : undefined;
    }
    const source = state.source;
    if (typeof source.readVar !== 'function') return undefined;
    const value = source.readVar(key);
    // caches misses too
    c.set(key, value);
    return value;
}

export function refreshCache(): void {
    // an inferred environment can change once the new vars load
    if (!state.environmentExplicitlySet) state.environment = undefined;
    cache.clear();
    state.cacheBuilt = false;
    state.dotenvAddedKeys = new Set<string>();
    debugVerbose('cache cleared, reloading config');
    ensureLoaded();
}

export function mirrorToProcessEnv(): void {
    if (state.dotenvAddedKeys.size === 0) return;
    const source = state.source;
    /* v8 ignore next -- @preserve dotenv keys only accumulate under a file source, so the delta implies supportsFiles here */
    if (!source.supportsFiles) return;
    const mirrored: Record<string, string> = {};
    for (const key of state.dotenvAddedKeys) {
        const value = cache.get(key);
        /* v8 ignore next -- @preserve the loader only writes strings */
        if (typeof value !== 'string') continue;
        mirrored[key] = resolveForMirror(key, value);
        debugVerbose(`mirrored ${key} to the ambient environment`);
    }
    source.writeVars(mirrored);
    debugVerbose(`mirrored ${state.dotenvAddedKeys.size} keys to the ambient environment`);
}

function resolveForMirror(key: string, value: string): string {
    return templateResolver.resolveTemplate(key, value);
}

export function setEnvironment(env: string): void {
    Validator.validateEnvironment(env);
    state.environment = parseEnvironment(env) ?? Environment.Development;
    state.environmentExplicitlySet = true;
    refreshCache();
}

export function determineEnvironment(): void {
    const raw = firstEnvKeyValue((key) => readCached(key));
    if (raw === undefined) {
        debugWarn(`no environment set (looked for ${ENV_KEYS.join(', ')}); defaulting to development`);
        state.environment = Environment.Development;
        return;
    }
    const parsed = parseEnvironment(raw);
    if (parsed === undefined) {
        debugWarn(`unrecognized environment "${raw}"; defaulting to development`);
        state.environment = Environment.Development;
        return;
    }
    state.environment = parsed;
}

// arrows because readPrimitive reads templateResolver, which is assigned below
const envService: EnvapterService = {
    getRaw: (key) => resolveKeyInput(key).value,
    get: (key, fallback) => readPrimitive(key, 'string', fallback)
};

const templateResolver: TemplateResolver = new TemplateResolver(envService);
export const valueConverter: ValueConverter = new ValueConverter(envService);

// TS can't assign a value to a conditional type on an unresolved generic
export function readPrimitive<
    TToken extends PrimitiveToken,
    TFallback extends InferConverterReturnType<TToken> | undefined = undefined
>(key: EnvKeyInput, type: TToken, fallback?: TFallback): AdvancedConverterReturn<TToken, TFallback>;
export function readPrimitive(
    key: EnvKeyInput,
    type: PrimitiveToken,
    fallback?: InferConverterReturnType<PrimitiveToken>
): unknown {
    const { key: resolvedKey, value } = resolveKeyInput(key);
    if (isMissing(value)) {
        if (fallback !== undefined) debugWarn(`${resolvedKey} is missing or empty, using fallback ${String(fallback)}`);
        else debugWarn(`${resolvedKey} is missing or empty`);
        return fallback;
    }

    const parsed = templateResolver.resolveTemplate(resolvedKey, String(value));

    const converted = BuiltInConverters.getConverter(type)(parsed);

    if (converted === undefined) {
        // leave the value out because env values can be secrets
        debugVerbose(
            `could not convert ${resolvedKey} as ${type}${fallback !== undefined ? ', using the fallback' : ''}`
        );
        return fallback;
    }

    return converted;
}
