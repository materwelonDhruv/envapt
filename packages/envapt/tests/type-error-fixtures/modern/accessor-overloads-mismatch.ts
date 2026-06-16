import { Converters } from '../../../src';
import { Envapt } from '../../../src/decorators/modern';

// Every decorated accessor below declares a type that cannot hold the converter output, so each must
// fail to compile (one diagnostic per accessor).
export class OverloadMismatch {
    @Envapt('A', { converter: Converters.Number, fallback: 3000 })
    static accessor a: string;

    @Envapt('B', { converter: Converters.Url })
    static accessor b: URL;

    @Envapt('C', { converter: Number, fallback: 100 })
    static accessor c: string;

    @Envapt('D', { required: true })
    static accessor d: number;

    @Envapt('E')
    static accessor e: string;

    @Envapt('F', { fallback: 3000 })
    static accessor f: string;
}
