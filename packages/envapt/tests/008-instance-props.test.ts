import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Converters, Envapter } from '../src';
import { Envapt } from '../src/legacy';

describe('Instance Properties with @Envapt', () => {
    beforeAll(() => {
        Envapter.envPaths = resolve(import.meta.dirname, '.env.instance-props-test');
    });

    describe('basic instance properties', () => {
        class BasicInstanceProperties extends Envapter {
            @Envapt('INSTANCE_PROP_1') declare instanceProp1: string | undefined;

            @Envapt('INSTANCE_PROP_2') declare instanceProp2: string | undefined;
        }

        const instance = new BasicInstanceProperties();

        it('should have correct instance property values', () => {
            expect(instance.instanceProp1).to.equal('value1');
            expect(instance.instanceProp2).to.equal('value2');
        });
    });

    describe('multiple instances with same class', () => {
        class MultiInstanceTest {
            @Envapt('INSTANCE_PROP_1', { fallback: 'default' })
            declare readonly prop1: string;

            @Envapt('INSTANCE_NUMBER', { converter: Converters.Number, fallback: 0 })
            declare readonly numProp: number;
        }

        it('should work correctly across multiple instances', () => {
            const instance1 = new MultiInstanceTest();
            const instance2 = new MultiInstanceTest();

            expect(instance1.prop1).to.equal('value1');
            expect(instance2.prop1).to.equal('value1');
            expect(instance1.numProp).to.equal(42);
            expect(instance2.numProp).to.equal(42);
        });
    });

    describe('inheritance with instance properties', () => {
        class BaseClassWithInstance {
            @Envapt('INSTANCE_PROP_1', { fallback: 'base-default' })
            declare readonly baseProp: string;
        }

        class DerivedClassWithInstance extends BaseClassWithInstance {
            @Envapt('INSTANCE_PROP_2', { fallback: 'derived-default' })
            declare readonly derivedProp: string;
        }

        it('reads both the inherited and the derived instance properties', () => {
            const derivedInstance = new DerivedClassWithInstance();
            expect(derivedInstance.baseProp).to.equal('value1');
            expect(derivedInstance.derivedProp).to.equal('value2');
        });
    });
});
