import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Envapter } from '../src';
import { createAccessorDecorator } from '../src/decorators/modern/createAccessorDecorator';
import { EnvaptError } from '../src/infra/Error';
import { Envapt } from '../src/legacy';

describe('decorator value resolution', () => {
    beforeAll(() => (Envapter.envPaths = resolve(`${import.meta.dirname}/.env.034`)));

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
        it('throws EnvaptError instead of collapsing every accessor to the "undefined" cache key', () => {
            const decorate = createAccessorDecorator('SOME_KEY', {
                fallback: undefined,
                converter: undefined,
                hasFallback: false,
                required: false,
                schema: undefined
            });
            // a transform that drops the accessor name (vitest's oxc transform does this)
            const context = {
                name: undefined,
                kind: 'accessor',
                static: true
            } as unknown as ClassAccessorDecoratorContext<unknown, unknown>;
            const target = {
                get: () => undefined,
                set: () => undefined
            } as unknown as ClassAccessorDecoratorTarget<unknown, unknown>;

            expect(() => decorate(target, context)).to.throw(EnvaptError);
        });
    });
});
