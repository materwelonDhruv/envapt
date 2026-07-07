import { EnvapterBase } from '../core/EnvapterBase';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';
import { writeRuntimeLine } from '../infra/runtime';

// EnvapterBase must never import this module back, or the chain cycles.
const warned = new Set<string>();

function fileApiUnsupported(api: string): never {
    throw new EnvaptError(
        EnvaptErrorCodes.FileApiUnsupported,
        `Envapter.${api} requires a filesystem-backed source and is not available in this build.`
    );
}

// warns regardless of Envapter.debug (debugWarn would gate on it)
function warnOnce(api: string): void {
    if (warned.has(api)) return;
    warned.add(api);
    writeRuntimeLine(
        `[envapt] Envapter.${api} is a filesystem-only API and has no effect in the portable build. ` +
            `Set Envapter.fileApiMode = 'throw' to throw instead.`
    );
}

export function portableFileApiRead<Value>(api: string, fallback: Value): Value {
    if (EnvapterBase.fileApiMode === 'throw') fileApiUnsupported(api);
    warnOnce(api);
    // warn mode no-ops, so the read returns the getter's empty default rather than undefined
    return fallback;
}

export function portableFileApiWrite(api: string): void {
    if (EnvapterBase.fileApiMode === 'throw') fileApiUnsupported(api);
    warnOnce(api);
}
