import { PortableSource } from './PortableSource';

/**
 * @deprecated Renamed to {@link PortableSource}, which serves every no-filesystem runtime the same way.
 * Removed in v8. Replace `new ManualEnvSource(obj)` with `new PortableSource(obj)`.
 * @public
 */
export class ManualEnvSource extends PortableSource {}
