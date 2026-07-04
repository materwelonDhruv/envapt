import { BuiltInConverters, ValueConverter } from '../converters';
import { ENV_KEYS, Environment, firstEnvKeyValue, parseEnvironment } from './Environment';
import { isMissing } from './missing';
import { resolveEffectivePaths } from './paths';
import { cache, state } from './state';
import { TemplateResolver } from '../engine/TemplateResolver';
import { debugVerbose, debugWarn } from '../infra/Debug';
import { loadDotenv } from '../infra/Dotenv';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

import type { ConditionalReturn, EnvKeyInput } from '../types';
import type { EnvapterService } from '../types/Env';

export function resolveKeyInput(keyInput: EnvKeyInput): { key: string; value: string | undefined } {
    const keys = Array.isArray(keyInput) ? keyInput : [keyInput];
    const normalizedKeys = keys as readonly string[];

    if (normalizedKeys.length === 0) {
        throw new EnvaptError(EnvaptErrorCodes.InvalidKeyInput, 'At least one environment key must be provided.');
    }

    if (normalizedKeys.some((k) => typeof k !== 'string')) {
        throw new EnvaptError(EnvaptErrorCodes.InvalidKeyInput, 'Environment keys must be strings.');
    }

    if (normalizedKeys.some((k) => k.trim() === '')) {
        throw new EnvaptError(EnvaptErrorCodes.InvalidKeyInput, 'Environment keys cannot be empty strings.');
    }

    // An ordered read keeps trying so a present-but-empty candidate falls through to the next, matching
    // getRequired and firstEnvKeyValue. A single key or an all-empty list resolves to the first present value.
    let firstPresent: { key: string; value: string } | undefined;
    for (const candidate of normalizedKeys) {
        const value = readCached(candidate);
        if (value === undefined) continue;
        if (!isMissing(value)) return { key: candidate, value };
        firstPresent ??= { key: candidate, value };
    }

    return firstPresent ?? { key: normalizedKeys[0] as string, value: undefined };
}

export function ensureLoaded(): Map<string, unknown> {
    if (!state.cacheBuilt) {
        const source = state.source;
        // Clone so the loader and downstream reads never mutate the source's backing object.
        const isolatedEnv: Record<string, string> = { ...source.readVars() };

        let added = new Set<string>();
        // Sources without a filesystem (injected objects on the browser or Workers) skip the .env
        // cascade, profiles, and envPaths. Only the readVars() snapshot populates the cache.
        if (source.supportsFiles) {
            debugVerbose(`base dir: ${state.baseDir ?? 'working directory'}`);
            // Outside the try below so a missing configured profile path surfaces its EnvaptError. Only dotenv parse errors stay caught.
            const effectivePaths = resolveEffectivePaths();
            debugVerbose(`effective .env paths: ${effectivePaths.length === 0 ? '(none)' : effectivePaths.join(', ')}`);
            try {
                added = loadDotenv({
                    ...state.userDefinedEnvFileOptions,
                    path: effectivePaths,
                    processEnv: isolatedEnv,
                    readFile: source.readFile.bind(source)
                });
            } catch (error) {
                debugWarn(`failed to load .env: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        state.dotenvAddedKeys = added;
        for (const [key, value] of Object.entries(isolatedEnv)) cache.set(key, value);
        debugVerbose(`cache populated: ${cache.size} keys total`);
        // set before mirroring, whose template expansion reads the cache and would re-enter this build otherwise
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
    // cache a miss too, so a later read of an absent key skips the reader
    c.set(key, value);
    return value;
}

export function refreshCache(): void {
    // Reset an inferred environment so re-hydration re-determines it from current state. An explicit
    // Envapter.environment = X is preserved through the refresh and used for cascade selection.
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
        /* v8 ignore next -- @preserve loader only writes strings, defensive against future cache contents */
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

export function determineEnvironment(env?: string | Environment): void {
    if (typeof env === 'number') {
        state.environment = env;
        state.environmentExplicitlySet = true;
        return;
    }
    if (typeof env === 'string') {
        state.environment = parseEnvironment(env) ?? Environment.Development;
        state.environmentExplicitlySet = true;
        return;
    }

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

/**
 * @internal
 */
export enum Primitive {
    String,
    Number,
    Boolean,
    BigInt,
    Symbol
}

const PRIMITIVE_NAMES: Record<Primitive, string> = {
    [Primitive.String]: 'string',
    [Primitive.Number]: 'number',
    [Primitive.Boolean]: 'boolean',
    [Primitive.BigInt]: 'bigint',
    [Primitive.Symbol]: 'symbol'
};

// getRaw is the raw string lookup, get is the template-resolved string read. Lazy arrows so the
// resolver singletons below store envService without calling readPrimitive, which reads
// templateResolver before it is assigned.
const envService: EnvapterService = {
    getRaw: (key) => resolveKeyInput(key).value,
    get: (key, def) => readPrimitive<string, string | undefined>(key, Primitive.String, def)
};

export const templateResolver: TemplateResolver = new TemplateResolver(envService);
export const valueConverter: ValueConverter = new ValueConverter(envService);

export function readPrimitive<EnvVarReturnType, DefaultType extends EnvVarReturnType | undefined = undefined>(
    key: EnvKeyInput,
    type: Primitive,
    def?: DefaultType
): ConditionalReturn<EnvVarReturnType, DefaultType> {
    const { key: resolvedKey, value } = resolveKeyInput(key);
    if (isMissing(value)) {
        if (def !== undefined) debugWarn(`${resolvedKey} is missing or empty, using fallback ${String(def)}`);
        else debugWarn(`${resolvedKey} is missing or empty`);
        return def as ConditionalReturn<EnvVarReturnType, DefaultType>;
    }

    const parsed = templateResolver.resolveTemplate(resolvedKey, String(value));

    let converted: EnvVarReturnType | undefined;
    if (type === Primitive.Number) converted = BuiltInConverters.number(parsed) as EnvVarReturnType | undefined;
    else if (type === Primitive.Boolean) converted = BuiltInConverters.boolean(parsed) as EnvVarReturnType | undefined;
    else if (type === Primitive.BigInt) converted = BuiltInConverters.bigint(parsed) as EnvVarReturnType | undefined;
    else if (type === Primitive.Symbol) converted = BuiltInConverters.symbol(parsed) as EnvVarReturnType | undefined;
    else converted = BuiltInConverters.string(parsed) as EnvVarReturnType | undefined;

    if (converted === undefined) {
        // key and type only, no value: env values can be secrets and verbose logs reach stderr
        debugVerbose(
            `could not convert ${resolvedKey} as ${PRIMITIVE_NAMES[type]}${def !== undefined ? ', using the fallback' : ''}`
        );
        return def as ConditionalReturn<EnvVarReturnType, DefaultType>;
    }

    return converted;
}
