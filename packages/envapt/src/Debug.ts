import process from 'node:process';

import { EnvaptError, EnvaptErrorCodes } from './Error';

/**
 * Debug log levels for {@link Envapter.debug}. `silent` (default) emits nothing.
 * `warn` covers signals that might indicate misconfiguration: failed file reads,
 * unresolved templates (when not strict), fallback values used in place of missing
 * env. `verbose` adds every loaded file, per-file key count, per-key load lines, and
 * effective-paths / cache-rebuild notices.
 * @public
 */
export type DebugLevel = 'silent' | 'warn' | 'verbose';

const VALID_LEVELS: ReadonlySet<string> = new Set<DebugLevel>(['silent', 'warn', 'verbose']);

let currentLevel: DebugLevel = 'silent';
let initialized = false;

function isDebugLevel(value: string | undefined): value is DebugLevel {
    return value !== undefined && VALID_LEVELS.has(value);
}

// Reads `ENVAPT_DEBUG` lazily on first access. Setter wins after that.
function resolveLevel(): DebugLevel {
    if (!initialized) {
        const fromEnv = process.env.ENVAPT_DEBUG;
        currentLevel = isDebugLevel(fromEnv) ? fromEnv : 'silent';
        initialized = true;
    }
    return currentLevel;
}

/** @internal */
export function setDebugLevel(level: DebugLevel): void {
    if (!isDebugLevel(level)) {
        throw new EnvaptError(
            EnvaptErrorCodes.InvalidUserDefinedConfig,
            `Invalid debug level "${String(level)}". Expected 'silent' | 'warn' | 'verbose'.`
        );
    }
    currentLevel = level;
    initialized = true;
}

/** @internal */
export function getDebugLevel(): DebugLevel {
    return resolveLevel();
}

/** @internal */
export function resetDebugForTesting(): void {
    currentLevel = 'silent';
    initialized = false;
}

/** @internal */
export function debugWarn(message: string): void {
    const level = resolveLevel();
    if (level === 'warn' || level === 'verbose') {
        process.stderr.write(`[envapt] ${message}\n`);
    }
}

/** @internal */
export function debugVerbose(message: string): void {
    if (resolveLevel() === 'verbose') {
        process.stderr.write(`[envapt] ${message}\n`);
    }
}
