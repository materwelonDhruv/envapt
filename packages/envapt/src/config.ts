import { Envapter } from './Envapter';

// Side-effect entry (`import 'envapt/config'`, `node --import envapt/config`, `-r envapt/config` for CJS):
// a drop-in for `dotenv/config` that mirrors the loaded cascade into `process.env`.
Envapter.syncProcessEnv = true;
Envapter.load();
