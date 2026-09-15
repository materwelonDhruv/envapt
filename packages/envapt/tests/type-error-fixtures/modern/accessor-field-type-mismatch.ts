import { EnvNum } from '../../../src/decorators/modern';

// @EnvNum returns a number, and this accessor is a string
export class FieldTypeMismatch {
    @EnvNum('PORT', 3000)
    static accessor port: string;
}
