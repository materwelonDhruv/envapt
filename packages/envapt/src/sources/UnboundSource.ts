import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

import type { BareSource } from '../types';

export class UnboundSource implements BareSource {
    readonly supportsFiles = false;

    readVars(): Record<string, string> {
        throw new EnvaptError(
            EnvaptErrorCodes.NoSourceBound,
            'No environment source is bound. Call Envapter.useSource(...) with a source such as new PortableSource({...}) before reading.'
        );
    }
}
