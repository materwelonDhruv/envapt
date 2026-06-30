import { Envapter } from './Envapter';
import { portableFileApiRead, portableFileApiWrite } from './fileApiStub';

import type { EnvFileOptions } from '../infra/Dotenv';
import type { ProfilesConfig } from '../types';

/**
 * The browser/Workers/edge facade. {@link Envapter} with the filesystem-only config APIs present in
 * the type but inert at runtime by default. Under the default `fileApiMode` of `'warn'` they warn once
 * and no-op (getters return `undefined`, setters do nothing). `'throw'` restores the {@link EnvaptError}
 * `FileApiUnsupported`. The read side still throws `NoSourceBound` on first read until `useSource` binds
 * a source.
 * @public
 */
export class PortableEnvapter extends Envapter {
    static get envPaths(): string[] {
        return portableFileApiRead('envPaths');
    }
    static set envPaths(_paths: string[] | string) {
        portableFileApiWrite('envPaths');
    }

    static get baseDir(): string | undefined {
        return portableFileApiRead('baseDir');
    }
    static set baseDir(_value: string | URL | undefined) {
        portableFileApiWrite('baseDir');
    }

    static get envFileOptions(): EnvFileOptions {
        return portableFileApiRead('envFileOptions');
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
