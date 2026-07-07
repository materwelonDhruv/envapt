import { EnvNum } from '../../../src/decorators/modern';

// With no fallback the value can be undefined, so an accessor that omits undefined cannot hold it and must fail to compile.
export class FieldTypeNoFallback {
    @EnvNum('PORT')
    static accessor port: number;
}
