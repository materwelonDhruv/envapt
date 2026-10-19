import { Converters, Envapter } from '../../../src';

// Next.js writes `strict: false` into the tsconfig it generates
const config = Envapter.getRequiredAll({ DATABASE_URL: Converters.Url });

export const databaseUrl: URL = config.DATABASE_URL;
