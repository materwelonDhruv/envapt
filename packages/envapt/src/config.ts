import { Envapter } from './node';

// Side-effect entry (`import 'envapt/config'`, `node --import envapt/config`, `-r envapt/config` for CJS):
// a drop-in for `dotenv/config` that mirrors the loaded cascade into `process.env`. Imports the Node
// entry so the default source is bound before load(), even when only `envapt/config` is imported.
Envapter.syncProcessEnv = true;
Envapter.load();
