import { EnvNum } from '../../src/legacy';

// without a fallback the value can be undefined
export class FieldTypeNoFallback {
    @EnvNum('PORT')
    static readonly port: number;
}
