import process from 'node:process';

import { Envapter } from './Envapter';
import { setRuntimeSink } from './runtime';
import { NodeEnvSource } from './sources/NodeEnvSource';

// Node entry: wires the default source + stderr sink so `import 'envapt'` (and `envapt/config`) work
// without an explicit useSource() on Node, Bun, and Deno. The engine stays node-free; this file and
// NodeEnvSource are the only places that touch node:*.
setRuntimeSink((line) => process.stderr.write(`${line}\n`));
Envapter.useSource(new NodeEnvSource());

export * from '.';
