export function isPrerelease(version: string): boolean {
    return /^\d+\.\d+\.\d+-/.test(version);
}

/**
 * Returns an error message when the branch, pre-mode, tag, and version don't match up for a
 * publish, or `null` when it is safe to publish.
 */
export function branchGuardError(
    branch: string,
    mode: string,
    tag: string | undefined,
    version: string
): string | null {
    if (branch === 'next') {
        if (mode !== 'pre') return `next must be in changeset pre-mode (pre.json mode=pre); got '${mode}'.`;
        if (!tag || tag === 'latest')
            return `next pre-mode tag must be a dedicated prerelease channel, never 'latest'; got '${tag ?? '(none)'}'.`;
        // 7.0.1 reached the next tag because `changeset pre exit` turned the prerelease into a plain
        // `7.0.1` and pre mode was re-entered afterward. on next the version must stay a prerelease.
        if (!isPrerelease(version))
            return `next must publish a prerelease (X.Y.Z-${tag}.N), got plain '${version}'. Run the clean release from main.`;
    }
    if (branch === 'main') {
        if (mode === 'pre') return `main must not be in pre-mode. Refusing to publish a prerelease to the latest tag.`;
        if (isPrerelease(version))
            return `main version '${version}' is a prerelease. Run \`changeset pre exit\` before merging to main.`;
    }
    return null;
}

/**
 * {@link branchGuardError}, applied only when a publish is actually about to run. The Action opens a
 * version PR while changesets are pending and skips a version already on the registry, and CI bumps
 * the version later, so neither of those pushes should be checked against the version. Returns the
 * message, or `null`.
 */
export function publishGuardError(
    branch: string,
    mode: string,
    tag: string | undefined,
    version: string,
    publishState: { pendingChangesets: boolean; needsPublish: boolean }
): string | null {
    const willPublish = !publishState.pendingChangesets && publishState.needsPublish;
    if (!willPublish) return null;
    return branchGuardError(branch, mode, tag, version);
}
