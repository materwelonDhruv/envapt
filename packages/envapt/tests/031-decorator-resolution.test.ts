import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Envapter, EnvaptError, EnvaptErrorCodes, Envapt as ModernEnvapt } from '../src';
import { Envapt } from '../src/legacy';

describe('decorator value resolution', () => {
    beforeAll(() => (Envapter.envPaths = resolve(`${import.meta.dirname}/.env.031`)));

    describe('caching an undefined result', () => {
        let calls = 0;
        class UndefinedResult {
            @Envapt('CACHE_UNDEF_034', {
                fallback: undefined,
                converter: () => {
                    calls++;
                    return undefined;
                }
            })
            public static readonly value: string | undefined;
        }

        it('resolves once and caches the undefined instead of re-resolving each access', () => {
            void UndefinedResult.value;
            void UndefinedResult.value;
            void UndefinedResult.value;
            expect(calls).to.equal(1);
        });
    });

    describe('modern accessor decorator with a missing context name', () => {
        it('throws InvalidUserDefinedConfig instead of collapsing every accessor to the "undefined" cache key', () => {
            const decorate = ModernEnvapt('SOME_KEY') as unknown as (target: unknown, context: unknown) => unknown;
            // a transform that leaves the accessor name unset (vitest's oxc transform does this)
            const context = { name: undefined, kind: 'accessor', static: true };
            const target = { get: () => undefined, set: () => undefined };

            expect(() => decorate(target, context))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
        });
    });
});
