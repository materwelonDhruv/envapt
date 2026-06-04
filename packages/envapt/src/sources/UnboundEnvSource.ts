import { EnvaptError, EnvaptErrorCodes } from '../Error';

import type { BareEnvSource } from '../types';

/**
 * The default source until one is bound. Every read throws NoSourceBound so a forgotten `useSource`
 * surfaces at read time instead of silently yielding nothing. The Node entry binds {@link NodeEnvSource}
 * at load; browser and Workers bundles must call `Envapter.useSource(...)` before reading.
 * @internal
 */
export class UnboundEnvSource implements BareEnvSource {
    readonly supportsFiles = false;

    readVars(): Record<string, string> {
        throw new EnvaptError(
            EnvaptErrorCodes.NoSourceBound,
            'No environment source is bound. Call Envapter.useSource(...) with a source such as new ManualEnvSource({...}) or new WorkerEnvSource(env) before reading.'
        );
    }
}
