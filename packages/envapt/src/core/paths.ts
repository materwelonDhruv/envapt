import { Environment, firstEnvKeyValue, parseEnvironment } from './Environment';
import { state } from './state';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

import type { EnvProfile, FileCapableSource, Source } from '../types';

// without a baseDir the source resolves the path against its own default, process.cwd() on Node
export function resolveAgainstBase(candidate: string): string {
    const baseDir = state.baseDir;
    if (baseDir === undefined) return candidate;
    const source = state.source;
    /* v8 ignore next -- @preserve callers are all file-gated, so the source is never bare here */
    if (!source.supportsFiles) return candidate;
    return source.resolvePath(baseDir, candidate);
}

export function assertFileApiSupported(api: string, source: Source): asserts source is FileCapableSource {
    if (!source.supportsFiles) {
        throw new EnvaptError(
            EnvaptErrorCodes.FileApiUnsupported,
            `${api} requires a filesystem-backed source; the bound source does not support .env files.`
        );
    }
}

export function sourceFileExists(path: string): boolean {
    const source = state.source;
    /* v8 ignore next -- @preserve every caller is file-gated, so this never sees a bare source */
    if (!source.supportsFiles) return false;
    return source.readFile(path, 'utf8') !== undefined;
}

// most specific first, since the loader keeps the first value per key unless override is on
function buildCascadePaths(env: Environment): string[] {
    const envName = Environment[env].toLowerCase();
    return [`.env.${envName}.local`, `.env.${envName}`, '.env.local', '.env']
        .map((name) => resolveAgainstBase(name))
        .filter((p) => sourceFileExists(p));
}

function normalizeProfilePaths(profile: EnvProfile | undefined): string[] {
    if (!profile) return [];
    return Array.isArray(profile.paths) ? profile.paths : [profile.paths];
}

// reads the source directly because readCached would re-enter the cache build
function getCascadeEnvironment(): Environment {
    if (state.environment !== undefined) return state.environment;

    const source = state.source;
    const vars = source.readVars();
    const raw = firstEnvKeyValue((key) => vars[key] ?? source.readVar?.(key));
    return raw === undefined ? Environment.Development : (parseEnvironment(raw) ?? Environment.Development);
}

export function resolveEffectivePaths(): string[] {
    if (state.envPathsExplicitlySet) return state.envPaths.map((p) => resolveAgainstBase(p));

    const env = getCascadeEnvironment();
    const profileEntry = state.profiles?.[env];
    const profilePaths = normalizeProfilePaths(profileEntry);

    if (profilePaths.length > 0) {
        const missing = profilePaths.filter((p) => !sourceFileExists(resolveAgainstBase(p)));
        if (missing.length > 0) {
            throw new EnvaptError(
                EnvaptErrorCodes.EnvFilesNotFound,
                `Environment file not found at path: ${missing.join(', ')}`
            );
        }
    }

    const cascade = state.profiles?.useDefaults === false ? [] : buildCascadePaths(env);
    return [...profilePaths.map((p) => resolveAgainstBase(p)), ...cascade];
}
