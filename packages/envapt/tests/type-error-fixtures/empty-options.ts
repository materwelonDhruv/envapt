import { Envapt } from '../../src/legacy';

// the overloads reject {} (TS2769) to match the runtime throw in parseEnvaptOptions
export class EmptyOptions {
    @Envapt('EMPTY', {})
    static readonly value: string | undefined;
}
