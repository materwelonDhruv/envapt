import { expect } from 'chai';
import { describe, it } from 'vitest';

import { Envapter, EnvaptError, EnvaptErrorCodes } from '../src/browser';
import { Envapter as WorkerdEnvapter } from '../src/workerd';

describe('portable build file-API stubs (v5.2)', () => {
    // The browser/workerd Envapter omits the filesystem-only APIs from its type (the @ts-expect-error
    // lines prove the omission), and each throws FileApiUnsupported (306) at runtime for JS bypassers.
    const throws306 = (fn: () => unknown): void => {
        expect(fn).to.throw(EnvaptError).with.property('code', EnvaptErrorCodes.FileApiUnsupported);
    };

    it('throws FileApiUnsupported for every omitted file API', () => {
        // @ts-expect-error envPaths is omitted from the portable Envapter
        throws306(() => Envapter.envPaths);
        throws306(() => {
            // @ts-expect-error envPaths is omitted from the portable Envapter
            Envapter.envPaths = '.env';
        });
        // @ts-expect-error baseDir is omitted from the portable Envapter
        throws306(() => Envapter.baseDir);
        // @ts-expect-error envFileOptions is omitted from the portable Envapter
        throws306(() => Envapter.envFileOptions);
        // accessing the stub getter throws before any call, so reference (don't invoke) the methods
        // @ts-expect-error configureProfiles is omitted from the portable Envapter
        throws306(() => Envapter.configureProfiles);
        // @ts-expect-error resetProfiles is omitted from the portable Envapter
        throws306(() => Envapter.resetProfiles);
    });

    it('exposes the same stubbed Envapter from the workerd entry', () => {
        expect(WorkerdEnvapter).to.equal(Envapter);
    });
});
