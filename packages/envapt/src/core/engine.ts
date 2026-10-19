import { createField } from '../converters';
import { ENVIRONMENT_KEYS, Environment, firstEnvKeyValue, parseEnvironment } from './Environment';
import { hasFallback, isMissing } from './missing';
import { resolveEffectivePaths } from './paths';
import { cache, state } from './state';
import { TemplateResolver } from '../engine/TemplateResolver';
import { Validator } from '../engine/Validators';
import { debugVerbose, debugWarn } from '../infra/Debug';
import { loadDotenv } from '../infra/Dotenv';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';
import { missingValue, missingValues, validationFailed } from '../infra/failures';
import { recase } from '../infra/recase';
import { UnboundSource } from '../sources/UnboundSource';

import type { Field, FieldSpec } from '../converters';
import type { StandardSchemaV1 } from '../infra/StandardSchema';
import type { EnvKeyInput, KeyCasing, PresentValue } from '../types';

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

    let firstEmpty: { key: string; value: string } | undefined;
    for (const candidate of normalizedKeys) {
        const value = readCached(candidate);
        if (value === undefined) continue;
        if (!isMissing(value)) return { key: candidate, value };
        firstEmpty ??= { key: candidate, value };
    }

    return firstEmpty ?? { key: normalizedKeys[0] as string, value: undefined };
}

function lookup(keyInput: EnvKeyInput): { key: string; value: string | undefined } {
    const { key, value } = resolveKeyInput(keyInput);
    if (value === undefined || isMissing(value)) return { key, value: undefined };
    return { key, value: templateResolver.resolveTemplate(key, value) };
}

export function findPresent(keyInput: EnvKeyInput): PresentValue | undefined {
    const { key, value } = lookup(keyInput);
    return value === undefined ? undefined : { key, value };
}

export function readOptional(keyInput: EnvKeyInput, spec: FieldSpec | undefined, fallback: unknown): unknown {
    const field = createField(spec, fallback);
    const { key, value } = lookup(keyInput);
    if (value === undefined) {
        debugWarn(`${key} is missing or empty${hasFallback(fallback) ? ', using the fallback' : ''}`);
        return field.fallback;
    }
    return field.convert({ key, value });
}

export function readRequired(keyInput: EnvKeyInput, spec: FieldSpec | undefined): unknown {
    const field = createField(spec);
    const present = findPresent(keyInput);
    if (present === undefined) throw missingValue(keyInput);
    const outcome = field.check(present);
    if (outcome.issues !== undefined) {
        throw validationFailed(EnvaptErrorCodes.InvalidEnvValue, [present.key], outcome.issues);
    }
    return outcome.value;
}

export function readRequiredAll(
    spec: Record<string, FieldSpec>,
    casing: KeyCasing | undefined
): Record<string, unknown> {
    const fields = Object.entries(spec).map(([key, entry]) => ({ key, field: createField(entry) }));
    const missing: string[] = [];
    const reads: { present: PresentValue; field: Field }[] = [];
    for (const { key, field } of fields) {
        const present = findPresent(key);
        if (present === undefined) missing.push(key);
        else reads.push({ present, field });
    }
    if (missing.length > 0) throw missingValues(missing);

    const result: Record<string, unknown> = {};
    const failedKeys: string[] = [];
    const issues: StandardSchemaV1.Issue[] = [];
    for (const { present, field } of reads) {
        const outcome = field.check(present);
        if (outcome.issues === undefined) {
            result[recase(present.key, casing)] = outcome.value;
        } else {
            failedKeys.push(present.key);
            issues.push(...outcome.issues);
        }
    }
    if (failedKeys.length > 0) throw validationFailed(EnvaptErrorCodes.InvalidEnvValue, failedKeys, issues);
    return result;
}

function ensureLoaded(): Map<string, unknown> {
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
    c.set(key, value);
    return value;
}

export function refreshCache(): void {
    // an inferred environment can change once the new vars load
    if (!state.environmentExplicitlySet) state.environment = undefined;
    cache.clear();
    state.cacheBuilt = false;
    state.dotenvAddedKeys = new Set<string>();
    // useSource rebuilds the cache when it binds one
    if (state.source instanceof UnboundSource) return;
    // below the unbound check since Debug caches ENVAPT_DEBUG on its first log
    debugVerbose('cache cleared, reloading config');
    ensureLoaded();
}

export function mirrorToProcessEnv(): void {
    if (state.dotenvAddedKeys.size === 0) return;
    const source = state.source;
    /* v8 ignore next -- @preserve dotenv keys only accumulate under a file source */
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
        debugWarn(`no environment set (looked for ${ENVIRONMENT_KEYS.join(', ')}); defaulting to development`);
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

const templateResolver: TemplateResolver = new TemplateResolver((key) => resolveKeyInput(key).value);
