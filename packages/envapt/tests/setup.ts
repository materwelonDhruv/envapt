// Binds the Node source + stderr sink for the suite; the engine default is UnboundSource.
import { Envapter, FileSource } from '../src';

// vitest sets NODE_ENV and MODE to 'test' on process.env. Strip them so the suite's default
// environment is a deterministic Development rather than the runner's test value, then rebind to
// rebuild the import-time cache. The test-environment mapping is covered in 031-environment-detection.
delete process.env.NODE_ENV;
delete process.env.MODE;
Envapter.useSource(new FileSource());
