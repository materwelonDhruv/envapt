/**
 * Side-effect entry (`import 'envapt/config'` or `node --import envapt/config`). A drop-in for
 * `dotenv/config` that loads the `.env` cascade and mirrors it into `process.env`.
 *
 * Set `ENVAPT_DEBUG=verbose` before the import to log the load. Setting `Envapter.debug` in code after
 * the import is too late because the load has already run.
 *
 * @module
 */

import { Envapter } from '.';

// the setter mirrors the cache that binding FileSource on import already loaded
Envapter.syncProcessEnv = true;
