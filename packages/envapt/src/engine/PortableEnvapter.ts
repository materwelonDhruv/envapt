import { Envapter } from './Envapter';
import { installFileApiStubs } from './installFileApiStubs';

/**
 * The browser/Workers facade. {@link Envapter} with the filesystem-only configuration APIs
 * (`envPaths`, `baseDir`, `envFileOptions`, `configureProfiles`, `resetProfiles`) stubbed to throw
 * {@link EnvaptError}. The portable types omit those APIs, so the stubs only guard JS callers that
 * bypass the types.
 * @public
 */
export class PortableEnvapter extends Envapter {
    // A static block (not a top-level statement in a separate entry) keeps the stub install intrinsic to
    // this class, so it tree-shakes out of a leaf import and needs no sideEffects entry. Depends on the
    // es2022 native static-block emit, lowering the target defeats it.
    static {
        installFileApiStubs(PortableEnvapter);
    }
}
