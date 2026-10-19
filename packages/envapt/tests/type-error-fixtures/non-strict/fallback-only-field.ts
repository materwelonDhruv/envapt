import { Envapt } from '../../../src/legacy';

export class Config {
    @Envapt('PORT', { fallback: 3000 })
    static readonly port: number;
}
