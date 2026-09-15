import { EnvNum } from '../../../src/decorators/modern';

// without a fallback the accessor type must include undefined
export class FieldTypeNoFallback {
    @EnvNum('PORT')
    static accessor port: number;
}
