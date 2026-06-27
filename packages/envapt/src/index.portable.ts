/**
 * The portable surface shared by the browser and Workers builds. Re-exports the same public API as the
 * Node entry but binds {@link Envapter} to a portable class whose filesystem-only config APIs throw.
 * Bind a source with `Envapter.useSource` before reading.
 *
 * @module
 */

export * from './common';
export * from './decorators/modern';
export { PortableEnvapter as Envapter } from './engine/PortableEnvapter';
