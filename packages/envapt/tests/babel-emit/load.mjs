import process from 'node:process';

import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url, { interopDefault: true });

await jiti.import(process.argv[2]);
