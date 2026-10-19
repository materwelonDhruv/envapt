import process from 'node:process';

import { Envapter } from './engine/Envapter';
import { setRuntimeSink } from './infra/runtime';
import { FileSource } from './sources/FileSource';

// list this file and every node entry that imports it in package.json sideEffects. webpack skips this import inside an unlisted entry
setRuntimeSink((line) => process.stderr.write(`${line}\n`));
Envapter.useSource(new FileSource());
