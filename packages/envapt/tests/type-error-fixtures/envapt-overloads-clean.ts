import { Converters } from '../../src';
import { Envapt } from '../../src/legacy';

// Correct declarations across the overloads, including no-fallback `| undefined` and a deliberately wider
// field, must all compile cleanly.
export class OverloadClean {
    @Envapt('A', { converter: Converters.Number, fallback: 3000 })
    static readonly a: number;

    @Envapt('B', { converter: Converters.Url })
    static readonly b: URL | undefined;

    @Envapt('C', { converter: Number, fallback: 100 })
    static readonly c: number;

    @Envapt('D', { required: true })
    static readonly d: string;

    @Envapt('E')
    static readonly e: string | undefined;

    @Envapt('F', { fallback: 3000 })
    static readonly f: number;

    @Envapt('G', { converter: Converters.Number, fallback: 1 })
    static readonly g: number | undefined;

    @Envapt('H', { converter: Converters.Number, fallback: undefined })
    static readonly h: number | undefined;
}
