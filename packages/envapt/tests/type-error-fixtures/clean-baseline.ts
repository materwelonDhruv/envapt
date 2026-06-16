import { Converters, Envapt } from '../../src';

export class CleanBaseline {
    @Envapt('PORT', { converter: Converters.Number, fallback: 3000 })
    static readonly port: number;

    @Envapt('API_KEY', { required: true })
    static readonly apiKey: string;
}
