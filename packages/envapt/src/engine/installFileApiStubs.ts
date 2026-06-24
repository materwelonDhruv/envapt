import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

const FILE_ONLY_APIS = ['envPaths', 'baseDir', 'envFileOptions', 'configureProfiles', 'resetProfiles'] as const;

function fileApiUnsupported(api: string): never {
    throw new EnvaptError(
        EnvaptErrorCodes.FileApiUnsupported,
        `Envapter.${api} requires a filesystem-backed source and is not available in this build.`
    );
}

// Call from a class static block, not an entry top level, or the build drops the stubs from a
// re-exported entry as a tree-shaken side effect.
export function installFileApiStubs(target: object): void {
    for (const api of FILE_ONLY_APIS) {
        Object.defineProperty(target, api, {
            configurable: true,
            get: () => fileApiUnsupported(api),
            set: () => fileApiUnsupported(api)
        });
    }
}
