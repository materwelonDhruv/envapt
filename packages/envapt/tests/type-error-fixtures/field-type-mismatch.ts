import { EnvNum } from '../../src';

// @EnvNum produces a number; a string field cannot hold it, so this must fail to compile.
export class FieldTypeMismatch {
    @EnvNum('PORT', 3000)
    static readonly port: string;
}
