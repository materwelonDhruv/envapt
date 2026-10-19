/**
 * The legacy decorator entry (`envapt/legacy`) on Node, Bun, and Deno. Importing it binds {@link FileSource}
 * the same way the main entry does.
 *
 * @module
 */

import './bindNodeDefaults';

export * from './legacy';
