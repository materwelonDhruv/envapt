import { Converters } from '../../../src';
import { Envapt } from '../../../src/decorators/modern';

// every accessor here must compile, including the wider ones
export class OverloadClean {
    @Envapt('A', { converter: Converters.Number, fallback: 3000 })
    static accessor a: number;

    @Envapt('B', { converter: Converters.Url })
    static accessor b: URL | undefined;

    @Envapt('C', { converter: Number, fallback: 100 })
    static accessor c: number;

    @Envapt('D', { required: true })
    static accessor d: string;

    @Envapt('E')
    static accessor e: string | undefined;

    @Envapt('F', { fallback: 3000 })
    static accessor f: number;

    @Envapt('G', { converter: Converters.Number, fallback: 1 })
    static accessor g: number | undefined;

    @Envapt('H', { converter: Converters.Number, fallback: undefined })
    static accessor h: number | undefined;

    @Envapt('I', { fallback: undefined })
    static accessor i: string | undefined;
}
