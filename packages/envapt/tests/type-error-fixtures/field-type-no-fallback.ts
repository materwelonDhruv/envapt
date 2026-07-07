import { EnvNum } from '../../src/legacy';

// With no fallback the value can be undefined, so a field that omits undefined cannot hold it and must fail to compile.
export class FieldTypeNoFallback {
    @EnvNum('PORT')
    static readonly port: number;
}
