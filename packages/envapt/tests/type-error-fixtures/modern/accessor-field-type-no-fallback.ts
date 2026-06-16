import { EnvNum } from '../../../src/decorators/modern';

// With no fallback the value can be null, so a non-null accessor cannot hold it and must fail to compile.
export class FieldTypeNoFallback {
    @EnvNum('PORT')
    static accessor port: number;
}
