import { Envapter } from './Envapter';
import { portableFileApiRead, portableFileApiWrite } from './fileApiStub';

import type { EnvFileOptions } from '../infra/Dotenv';
import type { ProfilesConfig } from '../types';

/**
 * Reads typed environment variables on Workers, the browser, and edge runtimes. It declares the same
 * filesystem-only config APIs as the Node build. Code that calls them type-checks on both builds.
 * Under the default `fileApiMode` of `'warn'` they warn once and do nothing. A getter returns an empty
 * value of its type. `'throw'` makes them throw {@link EnvaptError} `FileApiUnsupported`. Reads throw
 * `NoSourceBound` until `useSource` binds a source.
 * @public
 */
export class PortableEnvapter extends Envapter {
    static get envPaths(): string[] {
        return portableFileApiRead('envPaths', []);
    }
    static set envPaths(_paths: string[] | string) {
        portableFileApiWrite('envPaths');
    }

    static get baseDir(): string | undefined {
        return portableFileApiRead('baseDir', undefined);
    }
    static set baseDir(_value: string | URL | undefined) {
        portableFileApiWrite('baseDir');
    }

    static get envFileOptions(): EnvFileOptions {
        return portableFileApiRead('envFileOptions', {});
    }
    static set envFileOptions(_config: EnvFileOptions) {
        portableFileApiWrite('envFileOptions');
    }

    static configureProfiles(_config: ProfilesConfig): void {
        portableFileApiWrite('configureProfiles');
    }

    static resetPaths(): void {
        portableFileApiWrite('resetPaths');
    }
}
