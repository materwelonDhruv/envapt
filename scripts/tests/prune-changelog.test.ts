import { describe, expect, it } from 'vitest';

import { pruneSupersededPrereleases } from '../release/prune-changelog';

describe('pruneSupersededPrereleases', () => {
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
        const out = pruneSupersededPrereleases(input);
        expect(out).to.not.include('7.0.2-next.0');
        expect(out).to.include('## 7.0.2\n');
    });

    it('keeps a -next section that has no stable counterpart yet', () => {
        const input = ['# envapt', '', '## 7.0.3-next.0', '', '- a pending change', ''].join('\n');
        expect(pruneSupersededPrereleases(input)).to.include('7.0.3-next.0');
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
        const once = pruneSupersededPrereleases(input);
        expect(once).to.not.include('-next.');
        expect(once).to.include('## 7.0.2\n');
        expect(once).to.include('## 7.0.1\n');
        expect(pruneSupersededPrereleases(once)).to.equal(once);
    });
});
