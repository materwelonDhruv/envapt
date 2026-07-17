import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Envapter } from '../src';
import { Envapt } from '../src/legacy';

describe('User-defined errors', () => {
    beforeAll(() => (Envapter.envPaths = resolve(`${import.meta.dirname}/.env.user-defined-errors`)));

    describe('custom converter error handling', () => {
        class TestCustomErrors {
            @Envapt<string>('SECRET_TOKEN', {
                converter(raw, _fallback) {
                    if (typeof raw !== 'string' || raw === '') {
                        throw new Error('Missing SECRET_TOKEN');
                    }
                    return raw;
                }
            })
            public static readonly secretToken: string;

            @Envapt<string>('REQUIRED_CONFIG', {
                converter(raw) {
                    if (typeof raw !== 'string') {
                        throw new Error('REQUIRED_CONFIG is required');
                    }
                    return raw;
                }
            })
            public static readonly requiredConfig: string;

            @Envapt<string>('MISSING_INSTANCE_VAR', {
                converter(raw, _fallback) {
                    if (typeof raw !== 'string' || raw === '') {
                        throw new Error('Missing MISSING_INSTANCE_VAR');
                    }
                    return raw;
                }
            })
            declare public readonly missingInstanceVar: string;

            @Envapt<string>('MISSING_REQUIRED_INSTANCE', {
                converter(raw) {
                    if (typeof raw !== 'string') {
                        throw new Error('MISSING_REQUIRED_INSTANCE is required');
                    }
                    return raw;
                }
            })
            declare public readonly missingRequiredInstance: string;

            @Envapt<string>('API_KEY', {
                converter(raw, _fallback) {
                    if (typeof raw !== 'string') {
                        throw new Error('Missing API_KEY');
                    }
                    return raw;
                }
            })
            public static readonly apiKey: string;
        }

        it('should throw error for static property with fallback when env var is missing', () => {
            // a custom converter runs even when a fallback is set, so it can throw
            expect(() => TestCustomErrors.secretToken).to.throw('Missing SECRET_TOKEN');
        });

        it('should throw error for static property without fallback when env var is missing', () => {
            // no fallback, so the converter runs with raw undefined
            expect(() => TestCustomErrors.requiredConfig).to.throw('REQUIRED_CONFIG is required');
        });

        it('should throw error for instance property with fallback when env var is missing', () => {
            const instance = new TestCustomErrors();
            // a custom converter runs even when a fallback is set, so it can throw
            expect(() => instance.missingInstanceVar).to.throw('Missing MISSING_INSTANCE_VAR');
        });

        it('should throw error for instance property without fallback when env var is missing', () => {
            const instance = new TestCustomErrors();
            // no fallback, so the converter runs with raw undefined
            expect(() => instance.missingRequiredInstance).to.throw('MISSING_REQUIRED_INSTANCE is required');
        });

        it('should work correctly when env var exists', () => {
            expect(() => TestCustomErrors.apiKey).to.not.throw();
            expect(TestCustomErrors.apiKey).to.equal('valid_api_key_12345');
        });
    });

    describe('updated behavior', () => {
        it('should call custom converters even with fallbacks', () => {
            class UpdatedBehaviorTest {
                @Envapt<string>('NONEXISTENT_VAR', {
                    fallback: 'default_value',
                    converter(_raw, _fallback) {
                        throw new Error('This should now be thrown');
                    }
                })
                public static readonly testVar: string;
            }

            // the converter runs despite the fallback, so its throw propagates
            expect(() => UpdatedBehaviorTest.testVar).to.throw('This should now be thrown');
        });
    });
});
