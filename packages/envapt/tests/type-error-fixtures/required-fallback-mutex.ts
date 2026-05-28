import { Converters, Envapt } from '../../src';

export class IntentionallyBroken {
    @Envapt('PORT', { converter: Converters.Number, required: true, fallback: 3000 })
    declare static readonly port: number;
}
