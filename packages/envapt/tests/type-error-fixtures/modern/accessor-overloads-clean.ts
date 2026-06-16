import { Converters } from '../../../src';
import { Envapt } from '../../../src/decorators/modern';

// Correct declarations across the overloads, including no-fallback `| null`, `fallback: undefined`
// `| undefined`, and a deliberately wider field, must all compile cleanly.
export class OverloadClean {
    @Envapt('A', { converter: Converters.Number, fallback: 3000 })
    static accessor a: number;

    @Envapt('B', { converter: Converters.Url })
    static accessor b: URL | null;

    @Envapt('C', { converter: Number, fallback: 100 })
    static accessor c: number;

    @Envapt('D', { required: true })
    static accessor d: string;

    @Envapt('E')
    static accessor e: string | null;

    @Envapt('F', { fallback: 3000 })
    static accessor f: number;

    @Envapt('G', { converter: Converters.Number, fallback: 1 })
    static accessor g: number | null;

    @Envapt('H', { converter: Converters.Number, fallback: undefined })
    static accessor h: number | undefined;
}
