import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Envapter, EnvaptErrorCodes } from '../src';
import { EnvaptError } from '../src/infra/Error';
import { Envapt } from '../src/legacy';

describe('Symbol as a converter (v9)', () => {
    beforeAll(() => {
        Envapter.envPaths = resolve(import.meta.dirname, '.env.046-symbol-converter');
    });

    it('throws InvalidUserDefinedConfig from getWith', () => {
        expect(() => Envapter.getWith('CACHE_NAMESPACE', Symbol))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
    });

    it('throws InvalidUserDefinedConfig from getRequired', () => {
        expect(() => Envapter.getRequired('CACHE_NAMESPACE', Symbol))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
    });

    it('throws InvalidUserDefinedConfig when the decorator is applied', () => {
        const buildDecorator = (): void => {
            class Cache {
                @Envapt('CACHE_NAMESPACE', { converter: Symbol })
                static readonly namespace: symbol;
            }
            void Cache;
        };
        expect(buildDecorator).to.throw(EnvaptError).with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
    });

    it('throws FallbackConverterTypeMismatch for a symbol fallback with no converter', () => {
        class Cache {
            // a JS caller can still pass this
            @Envapt('CACHE_NAMESPACE', { fallback: Symbol.for('default') as unknown as string })
            static readonly namespace: string;
        }
        expect(() => Cache.namespace)
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
    });
});
