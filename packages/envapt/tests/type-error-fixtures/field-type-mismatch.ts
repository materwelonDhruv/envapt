import { EnvNum } from '../../src/legacy';

// a string field cannot hold the number @EnvNum returns
export class FieldTypeMismatch {
    @EnvNum('PORT', 3000)
    static readonly port: string;
}
