import { Envapt } from '../../../src/decorators/modern';

// parseEnvaptOptions throws on {} at runtime, and the overloads reject it at compile time
export class EmptyOptions {
    @Envapt('EMPTY', {})
    static accessor value: string | undefined;
}
