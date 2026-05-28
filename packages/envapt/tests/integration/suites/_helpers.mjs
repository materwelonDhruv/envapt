import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// `import.meta.dirname` is Node 20.11+; the matrix covers Node 20.0+, Bun, and Deno.
const HERE = dirname(fileURLToPath(import.meta.url));

export const FIXTURE_PATH = resolve(HERE, '../fixture.env');
