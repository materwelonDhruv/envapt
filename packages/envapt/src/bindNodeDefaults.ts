import process from 'node:process';

import { Envapter } from './engine/Envapter';
import { setRuntimeSink } from './infra/runtime';
import { FileSource } from './sources/FileSource';

// keep this file in package.json sideEffects. a decorators-only bundle drops it otherwise
setRuntimeSink((line) => process.stderr.write(`${line}\n`));
Envapter.useSource(new FileSource());
