import { Converters } from '../src';
import { Envapt } from '../src/legacy';

declare const maybeUrl: string | undefined;

export class Accepted {
    @Envapt('A', { converter: Converters.Number, fallback: 3000 })
    static readonly a: number;

    @Envapt('B', { converter: Converters.Url })
    static readonly b: URL | undefined;

    @Envapt('C', { converter: (raw) => raw.length, fallback: 100 })
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

    @Envapt('I', { fallback: undefined })
    static readonly i: string | undefined;

    @Envapt('J', { fallback: maybeUrl })
    static readonly j: string | undefined;
}

export class FieldTooNarrow {
    // @ts-expect-error the converter returns a number
    @Envapt('A', { converter: Converters.Number, fallback: 3000 })
    static readonly a: string;

    // @ts-expect-error without a fallback the value can be undefined
    @Envapt('B', { converter: Converters.Url })
    static readonly b: URL;

    // @ts-expect-error the custom converter returns a number
    @Envapt('C', { converter: (raw) => raw.length, fallback: 100 })
    static readonly c: string;

    // @ts-expect-error required with no converter reads a string
    @Envapt('D', { required: true })
    static readonly d: number;

    // @ts-expect-error a bare key can read undefined
    @Envapt('E')
    static readonly e: string;

    // @ts-expect-error a number fallback infers the number converter
    @Envapt('F', { fallback: 3000 })
    static readonly f: string;
}

export class RejectedOptions {
    // @ts-expect-error the positional form takes no fallback as the second argument
    @Envapt('HOST', 'localhost')
    static readonly host: string;

    // @ts-expect-error an empty options object matches no overload
    @Envapt('EMPTY', {})
    static readonly empty: string | undefined;

    // @ts-expect-error an object fallback needs a converter
    @Envapt('RETRY_POLICY', { fallback: { retries: 3, backoff: 'exponential' } })
    static readonly retryPolicy: { retries: number; backoff: string };
}
