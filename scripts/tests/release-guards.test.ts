import { describe, expect, it } from 'vitest';

import { branchGuardError, isPrerelease, publishGuardError } from '../release/release-guards';

describe('release branch guards', () => {
    describe('isPrerelease', () => {
        it('flags X.Y.Z-tag.N as a prerelease', () => {
            expect(isPrerelease('7.0.1-next.0')).to.equal(true);
        });
        it('treats a clean X.Y.Z as stable', () => {
            expect(isPrerelease('7.0.1')).to.equal(false);
        });
    });

    describe('next branch', () => {
        it('passes a prerelease in pre-mode on a dedicated tag', () => {
            expect(branchGuardError('next', 'pre', 'next', '7.0.1-next.0')).to.equal(null);
        });
        it('rejects a clean version on next (the 7.0.1 mis-tag that shipped)', () => {
            const err = branchGuardError('next', 'pre', 'next', '7.0.1');
            expect(err, 'a clean version must be refused on next').to.be.a('string');
            expect(err).to.include('prerelease');
        });
        it('rejects next when not in pre-mode', () => {
            expect(branchGuardError('next', 'exit', 'next', '7.0.1-next.0')).to.be.a('string');
        });
        it('rejects a latest tag on next', () => {
            expect(branchGuardError('next', 'pre', 'latest', '7.0.1-next.0')).to.be.a('string');
        });
        it('rejects a missing tag on next', () => {
            expect(branchGuardError('next', 'pre', undefined, '7.0.1-next.0')).to.be.a('string');
        });
    });

    describe('main branch', () => {
        it('passes a clean version out of pre-mode', () => {
            expect(branchGuardError('main', 'exit', undefined, '7.0.1')).to.equal(null);
        });
        it('rejects pre-mode on main', () => {
            expect(branchGuardError('main', 'pre', 'next', '7.0.1')).to.be.a('string');
        });
        it('rejects a prerelease on main', () => {
            expect(branchGuardError('main', 'exit', undefined, '7.0.1-next.0')).to.be.a('string');
        });
    });

    it('does not guard unrelated branches', () => {
        expect(branchGuardError('feature/x', 'exit', undefined, '7.0.1')).to.equal(null);
    });

    // The publish job versions later in CI, so the version at preflight is mid-flight unless a publish
    // is actually about to run (no changesets pending and the version not yet on the registry).
    describe('publishGuardError (only enforces on a real publish)', () => {
        it('refuses a clean version on next when a publish is about to happen', () => {
            const err = publishGuardError('next', 'pre', 'next', '7.0.1', {
                pendingChangesets: false,
                needsPublish: true
            });
            expect(err).to.be.a('string');
        });
        it('allows a clean version on next while changesets are pending (version PR, no publish)', () => {
            expect(
                publishGuardError('next', 'pre', 'next', '7.0.1', { pendingChangesets: true, needsPublish: true })
            ).to.equal(null);
        });
        it('allows a clean version on next already on the registry (reconcile push, no publish)', () => {
            expect(
                publishGuardError('next', 'pre', 'next', '7.0.1', { pendingChangesets: false, needsPublish: false })
            ).to.equal(null);
        });
        it('still refuses a prerelease on main when a publish is about to happen', () => {
            const err = publishGuardError('main', 'exit', undefined, '7.0.1-next.0', {
                pendingChangesets: false,
                needsPublish: true
            });
            expect(err).to.be.a('string');
        });
    });
});
