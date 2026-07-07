import { Environment, firstEnvKeyValue, parseEnvironment } from './Environment';
import { state } from './state';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

import type { EnvProfile, FileCapableSource, Source } from '../types';

// No baseDir: candidate returned unchanged so the source resolves it against its own default
// (process.cwd() on Node). Resolution goes through the source to keep this node-free.
export function resolveAgainstBase(candidate: string): string {
    const baseDir = state.baseDir;
    if (baseDir === undefined) return candidate;
    const source = state.source;
    /* v8 ignore next -- @preserve callers are all file-gated, so the source is never bare here */
    if (!source.supportsFiles) return candidate;
    return source.resolvePath(baseDir, candidate);
}

// File-based config (envPaths/baseDir/configureProfiles) is meaningless without a filesystem, and it
// throws instead of silently ignoring it on the browser or Workers. Narrows the source so callers
// can use the file capabilities (resolvePath/normalizeBaseDir) after the check.
export function assertFileApiSupported(api: string, source: Source): asserts source is FileCapableSource {
    if (!source.supportsFiles) {
        throw new EnvaptError(
            EnvaptErrorCodes.FileApiUnsupported,
            `${api} requires a filesystem-backed source; the bound source does not support .env files.`
        );
    }
}

// Existence via the bound source instead of fs.existsSync/accessSync: a file "exists" when the source
// can read it.
export function sourceFileExists(path: string): boolean {
    const source = state.source;
    /* v8 ignore next -- @preserve every caller is file-gated, so this never sees a bare source */
    if (!source.supportsFiles) return false;
    return source.readFile(path, 'utf8') !== undefined;
}

// Precedence is most-specific-wins (matches Vite / Astro / Vocs): `.env.${env}.local` > `.env.${env}`
// > `.env.local` > `.env`. This differs from dotenv-flow / Next.js, which put `.env.local` above
// `.env.${env}`. Most-specific-wins keeps a committed `.env.production` authoritative regardless of a
// stray `.env.local`. Missing files are filtered.
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

// the cache is not built yet here, so read the reader directly (readCached would re-enter this build)
function getCascadeEnvironment(): Environment {
    if (state.environment !== undefined) return state.environment;

    const source = state.source;
    const vars = source.readVars();
    const raw = firstEnvKeyValue((key) => vars[key] ?? source.readVar?.(key));
    return raw === undefined ? Environment.Development : (parseEnvironment(raw) ?? Environment.Development);
}

/**
 * Resolve the `.env` paths to load. When `envPaths` was explicitly set, only those load. Otherwise
 * layer any `configureProfiles` paths for the active environment (higher precedence) over the
 * dotenv-flow cascade, all in dotenv first-wins order. `useDefaults: false` drops the cascade.
 */
export function resolveEffectivePaths(): string[] {
    if (state.envPathsExplicitlySet) return state.envPaths.map((p) => resolveAgainstBase(p));

    const env = getCascadeEnvironment();
    const profileEntry = state.profiles?.[env];
    const profilePaths = normalizeProfilePaths(profileEntry);

    // Validate that explicitly configured profile paths exist for the active env.
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
