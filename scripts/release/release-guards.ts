export function isPrerelease(version: string): boolean {
    return /^\d+\.\d+\.\d+-/.test(version);
}

// returns null when the publish is safe
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
        // `7.0.1` and pre mode was re-entered afterward
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

// the changesets Action does not publish while changesets are pending or when the version is already on the registry
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
