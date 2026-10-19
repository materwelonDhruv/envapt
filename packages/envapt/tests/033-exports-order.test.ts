import { describe, expect, it } from 'vitest';

import pkg from '../package.json' with { type: 'json' };

interface ConditionTarget {
    types: string;
    default: string;
}
interface NodeTarget {
    import: ConditionTarget;
}

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
    return { import: { types: `./dist/types/${kind}.d.mts`, default: `./dist/node/${kind}.mjs` } };
}

describe('package exports map (v8)', () => {
    const dot: Record<string, unknown> = pkg.exports['.'];
    const legacy: Record<string, unknown> = pkg.exports['./legacy'];

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

    it('exposes ./package.json', () => {
        expect(pkg.exports['./package.json']).toBe('./package.json');
    });
});
