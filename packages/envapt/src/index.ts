/**
 * The default Node, Bun, and Deno entry. Re-exports the full public surface, the {@link Envapter}
 * class (bound to {@link FileSource} so `.env` files load with no setup), the modern TC39 `@Envapt`
 * decorators, the converter tokens, and Standard Schema validation.
 *
 * @module
 */

export * from './common';
export * from './decorators/modern';
export { NodeEnvapter as Envapter } from './engine/NodeEnvapter';
export { FileSource } from './sources/FileSource';
