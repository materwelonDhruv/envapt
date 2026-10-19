import { Converters, Envapter, PortableSource, merge } from 'envapt';

declare const env: { API_URL: string; BETA: boolean; RATE: number };

Envapter.useSource(merge(new PortableSource(env), new PortableSource({ EXTRA: '1' })));

export const apiUrl: URL = Envapter.getRequired('API_URL', Converters.Url);
export const beta: boolean = Envapter.getAs('BETA', Converters.Boolean, false);
const config = Envapter.getRequiredAll({ API_URL: Converters.Url, RATE: Converters.Float }, 'camelCase');
export const rate: number = config.rate;
Envapter.fileApiMode = 'throw';
