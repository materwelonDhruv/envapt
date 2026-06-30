import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

interface ConditionTarget {
    types: string;
    default: string;
}
interface NodeTarget {
    import: ConditionTarget;
    require: ConditionTarget;
}
type SubpathMap = Record<string, ConditionTarget | NodeTarget>;
interface PackageManifest {
    exports: Record<string, SubpathMap | string>;
    sideEffects: string[];
}

// justified: reading the repo's own package.json, the shape is fixed here
const pkg = JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8')
) as PackageManifest;

const PORTABLE_CONDITIONS = ['workerd', 'edge-light', 'fastly', 'worker', 'browser', 'react-native'];
// deno routes to the node build but lists before node so Deno resolves it first
const NODE_CONDITIONS = ['deno', 'node', 'default'];
const EXPECTED_KEY_ORDER = [...PORTABLE_CONDITIONS, ...NODE_CONDITIONS];

function portableTarget(kind: 'index' | 'legacy'): ConditionTarget {
    return {
        types: kind === 'index' ? './dist/types/index.portable.d.mts' : './dist/types/legacy.d.mts',
        default: `./dist/portable/${kind}.mjs`
    };
}

function nodeTarget(kind: 'index' | 'legacy'): NodeTarget {
    const types = `./dist/types/${kind}.d.mts`;
    return {
        import: { types, default: `./dist/node/${kind}.mjs` },
        require: { types, default: `./dist/node/${kind}.cjs` }
    };
}

describe('package exports map (v8)', () => {
    // justified: both subpaths map to the object form here, the string form is only './package.json'
    const dot = pkg.exports['.'] as SubpathMap;
    const legacy = pkg.exports['./legacy'] as SubpathMap;

    it('orders "." portable-first, then deno, node, default', () => {
        expect(Object.keys(dot)).toEqual(EXPECTED_KEY_ORDER);
    });

    it('orders "./legacy" identically', () => {
        expect(Object.keys(legacy)).toEqual(EXPECTED_KEY_ORDER);
    });

    it('routes every portable condition on "." to the portable build', () => {
        for (const condition of PORTABLE_CONDITIONS) {
            expect(dot[condition]).toEqual(portableTarget('index'));
        }
    });

    it('routes every portable condition on "./legacy" to the portable legacy build', () => {
        for (const condition of PORTABLE_CONDITIONS) {
            expect(legacy[condition]).toEqual(portableTarget('legacy'));
        }
    });

    it('routes deno, node, and default on "." to the node build', () => {
        for (const condition of NODE_CONDITIONS) {
            expect(dot[condition]).toEqual(nodeTarget('index'));
        }
    });

    it('routes deno, node, and default on "./legacy" to the node legacy build', () => {
        for (const condition of NODE_CONDITIONS) {
            expect(legacy[condition]).toEqual(nodeTarget('legacy'));
        }
    });

    it('removes the ./workerd and ./browser subpaths', () => {
        expect(pkg.exports['./workerd']).toBeUndefined();
        expect(pkg.exports['./browser']).toBeUndefined();
    });

    it('exposes ./package.json', () => {
        expect(pkg.exports['./package.json']).toBe('./package.json');
    });

    it('scopes sideEffects to the node config entry', () => {
        expect(pkg.sideEffects).toEqual(['./dist/node/config.cjs', './dist/node/config.mjs']);
    });
});
