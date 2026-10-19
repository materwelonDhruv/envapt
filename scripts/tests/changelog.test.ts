import { describe, expect, it } from 'vitest';

import changelog from '../release/changelog';

const OPTIONS = { repo: 'materwelonDhruv/envapt' };

describe('changelog lines', () => {
    it('links the pull request a squash merge commit names', async () => {
        const line = await changelog.getReleaseLine(
            { summary: 'Removed `getNumber`.', commit: 'a8c4803' },
            'major',
            OPTIONS
        );
        expect(line).to.equal('- Removed `getNumber`. ([#170](https://github.com/materwelonDhruv/envapt/pull/170))');
    });

    it('links the commit when its subject names no pull request', async () => {
        const line = await changelog.getReleaseLine(
            { summary: 'Changed a code.', commit: '0d2ca9d' },
            'major',
            OPTIONS
        );
        expect(line).to.equal(
            '- Changed a code. ([`0d2ca9d`](https://github.com/materwelonDhruv/envapt/commit/0d2ca9d))'
        );
    });

    it('writes the summary alone for a changeset with no commit', async () => {
        const line = await changelog.getReleaseLine({ summary: 'Fixed a hover.' }, 'patch', OPTIONS);
        expect(line).to.equal('- Fixed a hover.');
    });

    it('indents the later lines of a summary that spans several', async () => {
        const line = await changelog.getReleaseLine({ summary: 'Fixed a read.\n\nIt threw early.' }, 'patch', OPTIONS);
        expect(line).to.equal('- Fixed a read.\n\n  It threw early.');
    });
});
