import { normalizeSource } from './normalizeSource';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

import type { BareSource, FileCapableSource, Source } from '../types';

/**
 * Compose several sources into one, read last-wins. A later member's `readVars()` value overrides an
 * earlier member's for the same key. A member may be a `(key) => string | undefined` reader for a
 * source that reads one key at a time, and it fills a key missing from every snapshot. Bind the result
 * with `Envapter.useSource`. Throws {@link EnvaptErrorCodes.InvalidMergedSource} with no members or with
 * more than one file-backed member.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/sources#combining-sources}
 */
export function merge(...members: (Source | ((key: string) => string | undefined))[]): Source {
    if (members.length === 0) {
        throw new EnvaptError(EnvaptErrorCodes.InvalidMergedSource, 'merge requires at least one source.');
    }

    const sources = members.map(normalizeSource);

    const fileMembers = sources.filter((m): m is FileCapableSource => m.supportsFiles === true);
    if (fileMembers.length > 1) {
        throw new EnvaptError(
            EnvaptErrorCodes.InvalidMergedSource,
            'merge accepts at most one filesystem-backed source, so the .env cascade and file APIs route to a single member.'
        );
    }

    const readVars = (): Record<string, string> => {
        const merged: Record<string, string> = {};
        for (const m of sources) Object.assign(merged, m.readVars());
        return merged;
    };

    const readers = sources.filter(
        (m): m is Source & { readVar: (key: string) => string | undefined } => typeof m.readVar === 'function'
    );
    const readVar =
        readers.length === 0
            ? undefined
            : (key: string): string | undefined => {
                  let value: string | undefined;
                  for (const m of readers) {
                      const found = m.readVar(key);
                      if (found !== undefined) value = found;
                  }
                  return value;
              };

    const fileMember = fileMembers[0];
    if (!fileMember) {
        const bare: BareSource = { readVars };
        if (readVar) bare.readVar = readVar;
        return bare;
    }

    const fileCapable: FileCapableSource = {
        readVars,
        supportsFiles: true,
        readFile: (path, encoding) => fileMember.readFile(path, encoding),
        resolvePath: (baseDir, candidate) => fileMember.resolvePath(baseDir, candidate),
        normalizeBaseDir: (value) => fileMember.normalizeBaseDir(value),
        writeVars: (vars) => fileMember.writeVars(vars)
    };
    if (readVar) fileCapable.readVar = readVar;
    return fileCapable;
}
