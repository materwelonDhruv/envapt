/**
 * The portable build for Workers, the browser, and edge runtimes. It exports the Node entry's API
 * except `FileSource`. {@link Envapter}'s filesystem-only config APIs warn once and do nothing by
 * default. Set `Envapter.fileApiMode = 'throw'` to make them throw `FileApiUnsupported`. Bind a source
 * with `Envapter.useSource` before reading. Reading before that throws `NoSourceBound`.
 *
 * @module
 */

export * from './common';
export * from './decorators/modern';
export { PortableEnvapter as Envapter } from './engine/PortableEnvapter';
