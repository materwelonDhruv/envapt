import { Envapt } from '../../src/legacy';

// @Envapt(key, {}) carries no supported options key, and parseEnvaptOptions throws on it at runtime.
// the overload rejects it at compile time (TS2769) to keep the type surface aligned with that check.
export class EmptyOptions {
    @Envapt('EMPTY', {})
    static readonly value: string | undefined;
}
