// binds the Node source for the suite, the engine default is UnboundSource
import { Envapter, FileSource } from '../src';

// vitest sets NODE_ENV and MODE to 'test'. Strip them so the suite's default environment resolves
// to Development, then rebind to rebuild the import-time cache. 031-environment-detection covers the
// test-environment mapping.
delete process.env.NODE_ENV;
delete process.env.MODE;
Envapter.useSource(new FileSource());
