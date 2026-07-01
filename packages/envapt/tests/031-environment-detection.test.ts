import { afterEach, describe, expect, it } from 'vitest';

import { Environment, Envapter, FileSource, PortableSource } from '../src';

describe('Environment detection (v5.2)', () => {
    afterEach(() => {
        // Restore the Node default and clear any explicitly-set environment between cases.
        Envapter.useSource(new FileSource());
        Envapter.resetProfiles();
    });

    describe('MODE (Vite-family browser builds)', () => {
        it('maps MODE to the environment when no other key is set', () => {
            Envapter.useSource(new PortableSource({ MODE: 'production' }));
            expect(Envapter.isProduction).to.be.true;
            expect(Envapter.environment).to.equal(Environment.Production);
        });

        it('reads MODE for staging, development, and test', () => {
            Envapter.useSource(new PortableSource({ MODE: 'staging' }));
            expect(Envapter.isStaging).to.be.true;

            Envapter.useSource(new PortableSource({ MODE: 'development' }));
            expect(Envapter.isDevelopment).to.be.true;

            Envapter.useSource(new PortableSource({ MODE: 'test' }));
            expect(Envapter.isTest).to.be.true;
        });

        it('lets an explicit ENVIRONMENT outrank MODE', () => {
            Envapter.useSource(new PortableSource({ ENVIRONMENT: 'production', MODE: 'development' }));
            expect(Envapter.isProduction).to.be.true;
        });
    });

    describe('isTest', () => {
        it('detects the test environment from NODE_ENV=test', () => {
            Envapter.useSource(new PortableSource({ NODE_ENV: 'test' }));
            expect(Envapter.isTest).to.be.true;
            expect(Envapter.isDevelopment).to.be.false;
            expect(Envapter.environment).to.equal(Environment.Test);
        });
    });

    describe('case-insensitive matching (regression)', () => {
        it('matches staging regardless of case', () => {
            for (const value of ['staging', 'Staging', 'STAGING']) {
                Envapter.useSource(new PortableSource({ ENVIRONMENT: value }));
                expect(Envapter.isStaging, value).to.be.true;
            }
        });

        it('matches production and test regardless of case', () => {
            Envapter.useSource(new PortableSource({ ENV: 'PRODUCTION' }));
            expect(Envapter.isProduction).to.be.true;

            Envapter.useSource(new PortableSource({ ENVIRONMENT: 'Test' }));
            expect(Envapter.isTest).to.be.true;
        });
    });

    describe('explicit setter off Node', () => {
        it('accepts a string name', () => {
            Envapter.useSource(new PortableSource({}));
            Envapter.environment = 'staging';
            expect(Envapter.isStaging).to.be.true;
        });

        it('falls back to development for an unknown name', () => {
            Envapter.useSource(new PortableSource({}));
            Envapter.environment = 'whatever';
            expect(Envapter.isDevelopment).to.be.true;
        });
    });

    describe('fallback', () => {
        it('defaults to development when no environment key is set', () => {
            Envapter.useSource(new PortableSource({ FOO: 'bar' }));
            expect(Envapter.isDevelopment).to.be.true;
            expect(Envapter.environment).to.equal(Environment.Development);
        });

        it('defaults to development for an unrecognized value', () => {
            Envapter.useSource(new PortableSource({ ENVIRONMENT: 'preview' }));
            expect(Envapter.isDevelopment).to.be.true;
        });
    });
});
