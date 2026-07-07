import { describe, expect, it } from 'vitest';

import { changesetPathsFromFiles, maxBump } from '../semver-label';

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

describe('changesetPathsFromFiles', () => {
    it('yields nothing for a PR that adds no changeset (a CI-only PR)', () => {
        const files = [
            { filename: '.github/workflows/checks.yml', status: 'modified' },
            { filename: '.github/workflows/coverage.yml', status: 'modified' }
        ];
        expect(changesetPathsFromFiles(files)).to.deep.equal([]);
    });

    it('picks up a changeset the PR adds or edits', () => {
        const files = [
            { filename: '.changeset/strict-converters.md', status: 'added' },
            { filename: '.changeset/existing-edit.md', status: 'modified' },
            { filename: 'packages/envapt/src/x.ts', status: 'modified' }
        ];
        expect(changesetPathsFromFiles(files)).to.deep.equal([
            '.changeset/strict-converters.md',
            '.changeset/existing-edit.md'
        ]);
    });

    it('skips the changeset README and removed changesets', () => {
        const files = [
            { filename: '.changeset/README.md', status: 'modified' },
            { filename: '.changeset/dropped.md', status: 'removed' }
        ];
        expect(changesetPathsFromFiles(files)).to.deep.equal([]);
    });
});
