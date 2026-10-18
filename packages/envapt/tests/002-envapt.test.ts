import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Converters, Envapter } from '../src';
import { EnvaptError } from '../src/infra/Error';
import { Envapt } from '../src/legacy';

function splitList(raw: string): string[] {
    return raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

describe('Envapt', () => {
    beforeAll(() => (Envapter.envPaths = resolve(`${import.meta.dirname}/.env.envapt-test`)));

    describe('automatic type detection', () => {
        class TestTypeDetection {
            @Envapt('NONEXISTENT_VAR_WITHOUT_FALLBACK', { converter: Converters.String })
            public static readonly nonexistentVarWithoutFallback: string | undefined;

            @Envapt('NONEXISTENT_VAR_NO_OPTIONS')
            public static readonly nonexistentVarNoOptions: string | undefined;

            @Envapt('PORT', { fallback: 6956 })
            public static readonly port: number;

            @Envapt('IS_ENABLED', { fallback: false })
            public static readonly isEnabled: boolean;

            @Envapt('URI', { fallback: 'db://localhost:27017/' })
            public static readonly uri: string;

            @Envapt('BIGINT_VAR', { fallback: 23478n })
            public static readonly bigintVar: bigint;
        }

        it('should return undefined for non-existent variable without fallback but with converter', () => {
            expect(TestTypeDetection.nonexistentVarWithoutFallback).to.be.undefined;
        });

        it('should return undefined for non-existent variable without fallback or converter', () => {
            expect(TestTypeDetection.nonexistentVarNoOptions).to.be.undefined;
        });

        it('should detect number type from fallback', () => {
            expect(TestTypeDetection.port).to.equal(7777);
        });

        it('should detect boolean type from fallback', () => {
            expect(TestTypeDetection.isEnabled).to.be.true;
        });

        it('should detect string type from fallback', () => {
            expect(TestTypeDetection.uri).to.equal('mongodb://localhost:27017/');
        });

        it('should detect bigint type from fallback', () => {
            expect(TestTypeDetection.bigintVar).to.equal(99999n);
        });
    });

    describe('custom converter functions', () => {
        class TestCustomEnv {
            @Envapt('NONEXISTENT_ARRAY', { fallback: ['default1', 'default2'], converter: splitList })
            public static readonly nonexistentArray: string[];
        }

        it('should use fallback for non-existent variable with custom converter', () => {
            expect(TestCustomEnv.nonexistentArray).to.deep.equal(['default1', 'default2']);
        });
    });

    describe('multi-key lookups', () => {
        class MultiKeyEnv extends Envapter {
            @Envapt(['PRIMARY_SERVICE_PORT', 'LEGACY_SERVICE_PORT'], { converter: Converters.Number })
            public static readonly preferredPort: number | undefined;

            @Envapt(['MISSING_SERVICE_PORT', 'LEGACY_SERVICE_PORT'], { converter: Converters.Number })
            public static readonly legacyFallbackPort: number | undefined;
        }

        it('should respect ordering when multiple keys exist', () => {
            expect(MultiKeyEnv.preferredPort).to.equal(6060);
        });

        it('should fall through to later keys when earlier ones are missing', () => {
            expect(MultiKeyEnv.legacyFallbackPort).to.equal(9090);
        });
    });

    it('reads one variable into several fields with different options', () => {
        class MultiEnv {
            @Envapt('TEST_VAR_MULTI_CALL', { fallback: 'default' })
            public static readonly testVar: string;

            @Envapt('TEST_VAR_MULTI_CALL', { converter: Converters.String })
            public static readonly testVarWithConverter: string | undefined;

            @Envapt('TEST_VAR_MULTI_CALL', { converter: Converters.Number })
            public static readonly testVarWithFallbackAndConverter: number | undefined;
        }

        expect(MultiEnv.testVar).to.equal('42');
        expect(MultiEnv.testVarWithConverter).to.equal('42');
        expect(MultiEnv.testVarWithFallbackAndConverter).to.equal(42);
    });

    describe('read-only enforcement', () => {
        class ReadOnlyConfig {
            @Envapt('PORT', { fallback: 3000 })
            public static readonly port: number;
        }

        it('throws an EnvaptError when assigning to a decorated property', () => {
            // cast so the assignment compiles
            expect(() => ((ReadOnlyConfig as { port: number }).port = 9999)).to.throw(EnvaptError, 'read-only');
        });
    });
});
