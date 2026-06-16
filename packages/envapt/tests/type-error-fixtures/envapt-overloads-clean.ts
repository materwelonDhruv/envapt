import { Converters, Envapt } from '../../src';

// Correct declarations across the overloads, including no-fallback `| null` and a deliberately wider
// field, must all compile cleanly.
export class OverloadClean {
    @Envapt('A', { converter: Converters.Number, fallback: 3000 })
    static readonly a: number;

    @Envapt('B', { converter: Converters.Url })
    static readonly b: URL | null;

    @Envapt('C', { converter: Number, fallback: 100 })
    static readonly c: number;

    @Envapt('D', { required: true })
    static readonly d: string;

    @Envapt('E')
    static readonly e: string | null;

    @Envapt('F', { fallback: 3000 })
    static readonly f: number;

    @Envapt('G', { converter: Converters.Number, fallback: 1 })
    static readonly g: number | null;

    @Envapt('H', { converter: Converters.Number, fallback: undefined })
    static readonly h: number | undefined;
}
