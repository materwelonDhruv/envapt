import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

import type { FileCapableSource, Source } from '../types';

/**
 * Compose several sources into one, read last-wins. A later member's value overrides an earlier
 * member's value for the same key. Bind the result with `Envapter.useSource`. Throws
 * {@link EnvaptErrorCodes.InvalidMergedSource} with no members or with more than one file-backed member.
 * @public
 */
export function merge(...members: Source[]): Source {
    if (members.length === 0) {
        throw new EnvaptError(EnvaptErrorCodes.InvalidMergedSource, 'merge requires at least one source.');
    }

    const fileMembers = members.filter((m): m is FileCapableSource => m.supportsFiles === true);
    if (fileMembers.length > 1) {
        throw new EnvaptError(
            EnvaptErrorCodes.InvalidMergedSource,
            'merge accepts at most one filesystem-backed source, so the .env cascade and file APIs route to a single member.'
        );
    }

    const readVars = (): Record<string, string> => {
        const merged: Record<string, string> = {};
        for (const m of members) Object.assign(merged, m.readVars());
        return merged;
    };

    const fileMember = fileMembers[0];
    if (!fileMember) return { readVars };

    const fileCapable: FileCapableSource = {
        readVars,
        supportsFiles: true,
        readFile: (path, encoding) => fileMember.readFile(path, encoding),
        resolvePath: (baseDir, candidate) => fileMember.resolvePath(baseDir, candidate),
        normalizeBaseDir: (value) => fileMember.normalizeBaseDir(value),
        writeVars: (vars) => fileMember.writeVars(vars)
    };
    return fileCapable;
}
