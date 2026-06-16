import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { EnvNum, Envapter } from '../src';

describe('legacy decorator cache keys', () => {
    beforeAll(() => (Envapter.envPaths = resolve(import.meta.dirname, '.env.cache-keys')));

    it('a same-named static and instance field on one class resolve independently', () => {
        class Service {
            @EnvNum('COLLIDE_A', 0)
            static readonly value: number;

            @EnvNum('COLLIDE_B', 0)
            declare readonly value: number;
        }
        expect(Service.value).to.equal(111);
        expect(new Service().value).to.equal(222);
    });

    it('two distinct classes that share a name resolve independently', () => {
        const A = (() => {
            class Config {
                @EnvNum('COLLIDE_A', 1)
                static readonly port: number;
            }
            return Config;
        })();
        const B = (() => {
            class Config {
                @EnvNum('COLLIDE_ABSENT', 4321)
                static readonly port: number;
            }
            return Config;
        })();
        expect(A.port).to.equal(111);
        expect(B.port).to.equal(4321);
    });
});
