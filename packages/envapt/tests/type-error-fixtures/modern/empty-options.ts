import { Envapt } from '../../../src/decorators/modern';

// @Envapt(key, {}) carries no supported options key, and parseEnvaptOptions throws on it at runtime.
// the overload rejects it at compile time to keep the type surface aligned with that runtime check.
export class EmptyOptions {
    @Envapt('EMPTY', {})
    static accessor value: string | undefined;
}
