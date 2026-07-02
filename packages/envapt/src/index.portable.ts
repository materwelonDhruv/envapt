/**
 * The portable surface for Workers, the browser, and edge runtimes. Re-exports the same public API as
 * the Node entry, with {@link Envapter} as a portable class whose filesystem-only config APIs warn once
 * and no-op by default (`Envapter.fileApiMode = 'throw'` restores `FileApiUnsupported`). Bind a source
 * with `Envapter.useSource` before reading. An unbound read throws `NoSourceBound`.
 *
 * @module
 */

export * from './common';
export * from './decorators/modern';
export { PortableEnvapter as Envapter } from './engine/PortableEnvapter';
