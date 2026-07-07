import console from 'node:console';
import fs from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const STABLE = /^\d+\.\d+\.\d+$/;
const PRERELEASE = /^(\d+\.\d+\.\d+)-/;

function sectionVersion(section: string): string | undefined {
    return section.match(/^## (\S+)/)?.[1];
}

/**
 * Removes `## X.Y.Z-pre.N` sections whose stable `## X.Y.Z` already exists, so there aren't duplicate sections in the CHANGELOG
 */
export function pruneSupersededPrereleases(changelog: string): string {
    const sections = changelog.split(/(?=^## )/m);
    const stable = new Set<string>();
    for (const section of sections) {
        const version = sectionVersion(section);
        if (version && STABLE.test(version)) stable.add(version);
    }
    return sections
        .filter((section) => {
            const base = sectionVersion(section)?.match(PRERELEASE)?.[1];
            return !(base && stable.has(base));
        })
        .join('');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    const changelogPath = resolve(import.meta.dirname, '..', '..', 'packages', 'envapt', 'CHANGELOG.md');
    const before = fs.readFileSync(changelogPath, 'utf-8');
    const after = pruneSupersededPrereleases(before);
    if (after === before) {
        console.log('No superseded prerelease sections to prune');
    } else {
        fs.writeFileSync(changelogPath, after, 'utf-8');
        console.log(`Pruned superseded prerelease sections from ${changelogPath}`);
    }
}
