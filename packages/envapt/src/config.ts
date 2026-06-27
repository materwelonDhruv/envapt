/**
 * Side-effect entry (`import 'envapt/config'`, `node --import envapt/config`, `-r envapt/config` for
 * CJS). A drop-in for `dotenv/config` that loads the `.env` cascade and mirrors it into `process.env`.
 *
 * Set `ENVAPT_DEBUG=verbose` before the import to log the load. Setting `Envapter.debug` in code after
 * the import is too late, the load has already run.
 *
 * @module
 */

import { Envapter } from '.';

// Importing Envapter evaluates NodeEnvapter, whose static block binds the default source before load() runs.
Envapter.syncProcessEnv = true;
Envapter.load();
