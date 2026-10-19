import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Converters, Envapter, EnvaptErrorCodes } from '../src';
import { EnvaptError } from '../src/infra/Error';
import { Envapt } from '../src/legacy';

describe('constructors as converters (v9)', () => {
    beforeAll(() => {
        Envapter.envPaths = resolve(import.meta.dirname, '.env.042-constructor-converters');
    });

    it('rejects Symbol, pointing at Symbol.for', () => {
        // @ts-expect-error a constructor is not a converter
        expect(() => Envapter.getAs('CACHE_NAMESPACE', Symbol))
            .to.throw(EnvaptError, 'Symbol.for')
            .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
    });

    it('rejects a primitive constructor, pointing at the matching token', () => {
        // @ts-expect-error a constructor is not a converter
        expect(() => Envapter.getAs('MAX_CONNECTIONS', Number, 100))
            .to.throw(EnvaptError, 'Converters.Number')
            .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
    });

    it('rejects a constructor as an array element converter', () => {
        // @ts-expect-error a constructor is not a converter
        expect(() => Envapter.getAs('SHARD_IDS', Converters.array({ of: BigInt })))
            .to.throw(EnvaptError, 'Converters.BigInt')
            .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
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
