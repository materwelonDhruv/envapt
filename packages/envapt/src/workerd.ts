/**
 * The Cloudflare Workers build entry (`envapt/workerd`). Re-exports the portable surface. Bind a
 * `WorkerEnvSource` around the Workers `env` binding before reading.
 *
 * @module
 */

export * from './browser';
