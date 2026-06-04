import { Envapter } from '.';

// Side-effect entry (`import 'envapt/config'`, `node --import envapt/config`, `-r envapt/config` for CJS):
// a drop-in for `dotenv/config` that mirrors the loaded cascade into `process.env`. Importing Envapter
// evaluates NodeEnvapter, whose static block binds the default source before load() runs.
Envapter.syncProcessEnv = true;
Envapter.load();
