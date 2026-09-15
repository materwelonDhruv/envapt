// the engine starts with UnboundSource
import { Envapter, FileSource } from '../src';

// vitest sets NODE_ENV and MODE to 'test'. the suite expects Development.
delete process.env.NODE_ENV;
delete process.env.MODE;
Envapter.useSource(new FileSource());
