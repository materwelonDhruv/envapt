import { Envapter } from './Envapter';
import { portableFileApiRead, portableFileApiWrite } from './fileApiStub';

import type { EnvFileOptions } from '../infra/Dotenv';
import type { ProfilesConfig } from '../types';

/**
 * The browser/Workers/edge facade. It is {@link Envapter} with the filesystem-only config APIs kept in
 * the type. Under the default `fileApiMode` of `'warn'` they warn once and no-op (getters return an
 * empty default matching their type and setters do nothing). `'throw'` makes them throw
 * {@link EnvaptError} `FileApiUnsupported`. Reads throw `NoSourceBound` until `useSource` binds a source.
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

    static resetProfiles(): void {
        portableFileApiWrite('resetProfiles');
    }
}
