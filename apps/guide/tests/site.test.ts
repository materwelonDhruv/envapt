import { describe, expect, it } from 'vitest';

import { NPM_URL, npmTagForSite, npmVersionUrl } from '../lib/site';

describe('npmVersionUrl', () => {
    it('points at the version-specific npm page', () => {
        expect(npmVersionUrl('7.1.0')).toBe(`${NPM_URL}/v/7.1.0`);
    });

    it('keeps a prerelease version intact', () => {
        expect(npmVersionUrl('8.0.0-next.3')).toBe('https://www.npmjs.com/package/envapt/v/8.0.0-next.3');
    });
});

describe('npmTagForSite', () => {
    it('reads the next tag on the next host', () => {
        expect(npmTagForSite('https://next-envapt.materwelon.dev')).toBe('next');
    });

    it('reads the latest tag on the production host', () => {
        expect(npmTagForSite('https://envapt.materwelon.dev')).toBe('latest');
    });
});
