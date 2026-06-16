import { Envapter } from './Envapter';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

const FILE_ONLY_APIS = ['envPaths', 'baseDir', 'envFileOptions', 'configureProfiles', 'resetProfiles'] as const;

function fileApiUnsupported(api: string): never {
    throw new EnvaptError(
        EnvaptErrorCodes.FileApiUnsupported,
        `Envapter.${api} requires a filesystem-backed source and is not available in this build.`
    );
}

// Call from each entry's own top level, not via `export * from` another entry: the build tree-shakes a
// re-exported entry's side effect away, which would silently drop these stubs from that entry's output.
export function installFileApiStubs(): void {
    for (const api of FILE_ONLY_APIS) {
        Object.defineProperty(Envapter, api, {
            configurable: true,
            get: () => fileApiUnsupported(api),
            set: () => fileApiUnsupported(api)
        });
    }
}
