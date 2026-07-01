import { describe, expect, it } from 'vitest';

import { maxBump } from '../semver-label';

const changeset = (bump: string): string => `---\n'envapt': ${bump}\n---\n\nsummary line`;

describe('maxBump', () => {
    it('returns the single bump', () => {
        expect(maxBump([changeset('patch')])).to.equal('patch');
    });

    it('minor outranks patch', () => {
        expect(maxBump([changeset('patch'), changeset('minor')])).to.equal('minor');
    });

    it('major outranks everything', () => {
        expect(maxBump([changeset('patch'), changeset('major'), changeset('minor')])).to.equal('major');
    });

    it('picks the highest across packages in one file', () => {
        expect(maxBump([`---\n'a': patch\n'b': major\n---`])).to.equal('major');
    });

    it('ignores non-bump frontmatter lines', () => {
        expect(maxBump([`---\n'envapt': patch\nnote: ignore me\n---`])).to.equal('patch');
    });

    it('handles CRLF and double quotes', () => {
        expect(maxBump([`---\r\n"envapt": minor\r\n---\r\n`])).to.equal('minor');
    });

    it('returns null when a body has no frontmatter', () => {
        expect(maxBump(['just a summary, no frontmatter'])).to.equal(null);
    });

    it('returns null for an empty list', () => {
        expect(maxBump([])).to.equal(null);
    });
});
