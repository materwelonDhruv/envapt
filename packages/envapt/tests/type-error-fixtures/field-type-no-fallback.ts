import { EnvNum } from '../../src';

// With no fallback the value can be null, so a non-null field cannot hold it and must fail to compile.
export class FieldTypeNoFallback {
    @EnvNum('PORT')
    static readonly port: number;
}
