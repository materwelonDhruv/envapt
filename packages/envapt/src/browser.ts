import { Envapter } from './Envapter';
import { EnvaptError, EnvaptErrorCodes } from './Error';

export * from './common';
export { Envapter };

// These APIs are omitted from this build's Envapter type; the stubs below make a JS caller that
// bypasses the types get a branded FileApiUnsupported instead of "not a function".
const FILE_ONLY_APIS = ['envPaths', 'baseDir', 'envFileOptions', 'configureProfiles', 'resetProfiles'] as const;

function fileApiUnsupported(api: string): never {
    throw new EnvaptError(
        EnvaptErrorCodes.FileApiUnsupported,
        `Envapter.${api} requires a filesystem-backed source and is not available in this build.`
    );
}

for (const api of FILE_ONLY_APIS) {
    Object.defineProperty(Envapter, api, {
        configurable: true,
        get: () => fileApiUnsupported(api),
        set: () => fileApiUnsupported(api)
    });
}
