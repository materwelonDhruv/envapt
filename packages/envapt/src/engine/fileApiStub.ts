import { EnvapterBase } from '../core/EnvapterBase';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';
import { writeRuntimeLine } from '../infra/runtime';

// importing this from EnvapterBase would create an import cycle
const warned = new Set<string>();

function fileApiUnsupported(api: string): never {
    throw new EnvaptError(
        EnvaptErrorCodes.FileApiUnsupported,
        `Envapter.${api} requires a filesystem-backed source and is not available in this build.`
    );
}

// writes even when Envapter.debug is silent
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
    return fallback;
}

export function portableFileApiWrite(api: string): void {
    if (EnvapterBase.fileApiMode === 'throw') fileApiUnsupported(api);
    warnOnce(api);
}
