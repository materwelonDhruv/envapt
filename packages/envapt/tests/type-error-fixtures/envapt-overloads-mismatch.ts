import { Converters, Envapt } from '../../src';

// Every decorated field below declares a type that cannot hold the converter output, so each must
// fail to compile (one diagnostic per field).
export class OverloadMismatch {
    @Envapt('A', { converter: Converters.Number, fallback: 3000 })
    static readonly a: string;

    @Envapt('B', { converter: Converters.Url })
    static readonly b: URL;

    @Envapt('C', { converter: Number, fallback: 100 })
    static readonly c: string;

    @Envapt('D', { required: true })
    static readonly d: number;

    @Envapt('E')
    static readonly e: string;

    @Envapt('F', { fallback: 3000 })
    static readonly f: string;
}
