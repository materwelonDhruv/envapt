import { Envapt } from '../../src/legacy';

// a string second argument must match no overload (TS2769) since v6 removed the positional form
export class PositionalRemoved {
    @Envapt('HOST', 'localhost')
    static readonly host: string;
}
