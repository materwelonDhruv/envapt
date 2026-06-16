import { Converters } from '../../src';
import { Envapt } from '../../src/legacy';

export class CleanBaseline {
    @Envapt('PORT', { converter: Converters.Number, fallback: 3000 })
    static readonly port: number;

    @Envapt('API_KEY', { required: true })
    static readonly apiKey: string;
}
