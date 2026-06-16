import { EnvNum } from '../../../src/decorators/modern';

// @EnvNum produces a number, which a string accessor cannot hold, so this must fail to compile.
export class FieldTypeMismatch {
    @EnvNum('PORT', 3000)
    static accessor port: string;
}
