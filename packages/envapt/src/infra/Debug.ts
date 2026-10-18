import { EnvaptError, EnvaptErrorCodes } from './Error';
import { readRuntimeVar, writeRuntimeLine } from './runtime';

/**
 * Debug log levels for {@link Envapter.debug}. `silent` (default) logs nothing. `warn` logs failed
 * file reads, unresolved templates outside strict mode, an environment that falls back to
 * development, and every read of a missing or empty variable. `verbose` also logs each loaded file
 * and key, the effective `.env` paths, cache rebuilds, and each key whose value failed to convert.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/errors#debug-logging}
 */
export type DebugLevel = 'silent' | 'warn' | 'verbose';

const VALID_LEVELS: ReadonlySet<string> = new Set<DebugLevel>(['silent', 'warn', 'verbose']);

let currentLevel: DebugLevel = 'silent';
let initialized = false;

function isDebugLevel(value: string | undefined): value is DebugLevel {
    return value !== undefined && VALID_LEVELS.has(value);
}

function resolveLevel(): DebugLevel {
    if (!initialized) {
        const fromEnv = readRuntimeVar('ENVAPT_DEBUG');
        currentLevel = isDebugLevel(fromEnv) ? fromEnv : 'silent';
        initialized = true;
    }
    return currentLevel;
}

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

export function getDebugLevel(): DebugLevel {
    return resolveLevel();
}

export function resetDebugForTesting(): void {
    currentLevel = 'silent';
    initialized = false;
}

export function debugWarn(message: string): void {
    const level = resolveLevel();
    if (level === 'warn' || level === 'verbose') {
        writeRuntimeLine(`[envapt] ${message}`);
    }
}

export function debugVerbose(message: string): void {
    if (resolveLevel() === 'verbose') {
        writeRuntimeLine(`[envapt] ${message}`);
    }
}
