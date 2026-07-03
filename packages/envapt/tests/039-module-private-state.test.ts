import { describe, expect, it } from 'vitest';

import { EnvapterBase } from '../src/core/EnvapterBase';
import { EnvironmentMethods } from '../src/core/EnvironmentMethods';

describe("engine's mutable state is module-private and should not be exposed as class properties", () => {
    it('holds no mutable engine-state fields on EnvapterBase', () => {
        const fields = [
            '_source',
            '_strict',
            '_syncProcessEnv',
            '_fileApiMode',
            '_baseDir',
            '_envPaths',
            '_envPathsExplicitlySet',
            '_userDefinedEnvFileOptions',
            '_dotenvAddedKeys'
        ];
        const present = fields.filter((f) => Object.prototype.hasOwnProperty.call(EnvapterBase, f));
        expect(present).to.deep.equal([]);
    });

    it('holds no mutable environment-state fields on EnvironmentMethods', () => {
        const fields = ['_environment', '_environmentExplicitlySet', '_profiles'];
        const present = fields.filter((f) => Object.prototype.hasOwnProperty.call(EnvironmentMethods, f));
        expect(present).to.deep.equal([]);
    });
});

describe('the read cache is unreachable from a consumer subclass', () => {
    it('exposes no `config` accessor that returns the cache Map', () => {
        expect(Object.getOwnPropertyDescriptor(EnvapterBase, 'config')).to.equal(undefined);
    });
});
