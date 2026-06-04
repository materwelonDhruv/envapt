import process from 'node:process';

import { NodeEnvapter } from './NodeEnvapter';
import { setRuntimeSink } from './runtime';
import { NodeEnvSource } from './sources/NodeEnvSource';

// Node entry: binds the default source + stderr sink at import, so whatever pulls it in (the Node
// build entry, `envapt/config`, the test setup) gets a bound source with no useSource() call. The
// engine stays node-free; this file and NodeEnvSource are the only places that touch node:*.
setRuntimeSink((line) => process.stderr.write(`${line}\n`));
NodeEnvapter.useSource(new NodeEnvSource());

export * from '.';
