import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Envapter } from '../src';
import { EnvNum } from '../src/legacy';

type InstalledDecorator = (target: object, prop: string) => PropertyDescriptor | undefined;

// babel lowers a legacy decorator to this. it always redefines, taking whatever the decorator returned
function applyDecoratedDescriptor(
    target: object,
    property: string,
    decorator: InstalledDecorator,
    descriptor: PropertyDescriptor
): void {
    const applied = decorator(target, property) ?? descriptor;

    Object.defineProperty(target, property, applied);
}

// EnvNum brands its key parameter to check the field type, which a manual call cannot satisfy
const asDecorator = (built: unknown): InstalledDecorator => built as InstalledDecorator;

describe('legacy decorator descriptor', () => {
    beforeAll(() => (Envapter.envPaths = resolve(import.meta.dirname, '.env.descriptor')));

    it('returns the descriptor it installed', () => {
        class Config {
            static readonly port: number;
        }

        const returned = asDecorator(EnvNum('DESCRIPTOR_PORT', 0))(Config, 'port');

        expect(typeof returned?.get).toBe('function');
        expect(returned?.configurable).toBe(false);
        expect(Config.port).to.equal(8080);
    });

    it('survives a helper that redefines the property afterwards', () => {
        class Config {
            static readonly port: number;
        }

        applyDecoratedDescriptor(Config, 'port', asDecorator(EnvNum('DESCRIPTOR_PORT', 0)), {
            configurable: true,
            enumerable: true,
            writable: true,
            value: undefined
        });

        expect(Config.port).to.equal(8080);
    });
});
