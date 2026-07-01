import { PortableSource } from './PortableSource';

/**
 * @deprecated Use {@link PortableSource} instead, which wraps the Cloudflare `env` binding identically.
 * Removed in v8. Replace `new WorkerEnvSource(env)` with `new PortableSource(env)`.
 * @public
 */
export class WorkerEnvSource extends PortableSource {}
