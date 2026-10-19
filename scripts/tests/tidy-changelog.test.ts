import { describe, expect, it } from 'vitest';

import { tidyChangelog } from '../release/tidy-changelog';

describe('tidyChangelog', () => {
    it('drops a -next section once its stable version is present', () => {
        const input = [
            '# envapt',
            '',
            '## 7.0.2',
            '',
            '### Patch Changes',
            '',
            '- abc123: fix the thing',
            '',
            '## 7.0.2-next.0',
            '',
            '### Patch Changes',
            '',
            '- abc123: fix the thing',
            ''
        ].join('\n');
        const out = tidyChangelog(input);
        expect(out).to.not.include('7.0.2-next.0');
        expect(out).to.include('## 7.0.2\n');
    });

    it('keeps a -next section that has no stable counterpart yet', () => {
        const input = ['# envapt', '', '## 7.0.3-next.0', '', '- a pending change', ''].join('\n');
        expect(tidyChangelog(input)).to.include('7.0.3-next.0');
    });

    it('drops every -next.N for a graduated version and is idempotent', () => {
        const input = [
            '# envapt',
            '',
            '## 7.0.2',
            '',
            '- stable',
            '',
            '## 7.0.2-next.1',
            '',
            '- pre1',
            '',
            '## 7.0.2-next.0',
            '',
            '- pre0',
            '',
            '## 7.0.1',
            '',
            '- older stable',
            ''
        ].join('\n');
        const once = tidyChangelog(input);
        expect(once).to.not.include('-next.');
        expect(once).to.include('## 7.0.2\n');
        expect(once).to.include('## 7.0.1\n');
        expect(tidyChangelog(once)).to.equal(once);
    });

    it('renames the changesets headings and drops the breaking marker under the breaking heading', () => {
        const input = [
            '# envapt',
            '',
            '## 9.0.0',
            '',
            '### Major Changes',
            '',
            '- **BREAKING:** `load()` is removed. ([#170](https://github.com/o/r/pull/170))',
            '',
            '### Minor Changes',
            '',
            '- Added `ENVIRONMENT_KEYS`.',
            '',
            '### Patch Changes',
            '',
            '- Fixed a hover.',
            ''
        ].join('\n');
        expect(tidyChangelog(input)).to.equal(
            [
                '# envapt',
                '',
                '## 9.0.0',
                '',
                '### 💥 Breaking',
                '',
                '- `load()` is removed. ([#170](https://github.com/o/r/pull/170))',
                '',
                '### ✨ Minor',
                '',
                '- Added `ENVIRONMENT_KEYS`.',
                '',
                '### 🩹 Patch',
                '',
                '- Fixed a hover.',
                ''
            ].join('\n')
        );
    });

    it('moves a breaking entry out of a patch section into breaking, and stays the same on a second run', () => {
        const input = [
            '# envapt',
            '',
            '## 9.0.1',
            '',
            '### Patch Changes',
            '',
            '- Fixed a typo.',
            '- **BREAKING:** Fixed a read that threw the wrong code.',
            ''
        ].join('\n');
        const once = tidyChangelog(input);
        expect(once).to.equal(
            [
                '# envapt',
                '',
                '## 9.0.1',
                '',
                '### 💥 Breaking',
                '',
                '- Fixed a read that threw the wrong code.',
                '',
                '### 🩹 Patch',
                '',
                '- Fixed a typo.',
                ''
            ].join('\n')
        );
        expect(tidyChangelog(once)).to.equal(once);
    });
});
