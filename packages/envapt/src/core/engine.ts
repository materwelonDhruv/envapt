import { BuiltInConverters, ValueConverter } from '../converters';
import { ENV_KEYS, Environment, firstEnvKeyValue, parseEnvironment } from './Environment';
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

    for (const candidate of normalizedKeys) {
        const value = ensureLoaded().get(candidate) as string | undefined;
        if (value !== undefined) return { key: candidate, value };
    }

    return { key: normalizedKeys[0] as string, value: undefined };
}

export function treatAsMissing(value: string | undefined): boolean {
    if (value === undefined || value === '') return true;
    if (state.strict && value.trim() === '') return true;
    return false;
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
            } catch {}
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

    const raw = firstEnvKeyValue((key) => {
        const value = ensureLoaded().get(key);
        return typeof value === 'string' ? value : undefined;
    });
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
    if (treatAsMissing(value)) {
        if (def !== undefined) debugWarn(`${resolvedKey} is missing or empty, using fallback ${String(def)}`);
        else debugWarn(`${resolvedKey} is missing or empty`);
        return def as ConditionalReturn<EnvVarReturnType, DefaultType>;
    }
    const rawVal = value as string | number | boolean | undefined;

    const parsed = templateResolver.resolveTemplate(resolvedKey, String(rawVal));

    let result: EnvVarReturnType;
    if (type === Primitive.Number) result = BuiltInConverters.number(parsed, def as number) as EnvVarReturnType;
    else if (type === Primitive.Boolean) result = BuiltInConverters.boolean(parsed, def as boolean) as EnvVarReturnType;
    else if (type === Primitive.BigInt) result = BuiltInConverters.bigint(parsed, def as bigint) as EnvVarReturnType;
    else if (type === Primitive.Symbol) result = BuiltInConverters.symbol(parsed, def as symbol) as EnvVarReturnType;
    else result = BuiltInConverters.string(parsed, def as string) as EnvVarReturnType;

    return result;
}
