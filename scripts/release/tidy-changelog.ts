import console from 'node:console';
import fs from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

type Bucket = 'breaking' | 'minor' | 'patch';

const STABLE = /^\d+\.\d+\.\d+$/;
const PRERELEASE = /^(\d+\.\d+\.\d+)-/;
const VERSION_START = /(?=^## )/m;
const SECTION_START = /(?=^### )/m;
const ENTRY_START = /(?=^- )/m;
const MARKER = '- **BREAKING:** ';

const ORDER: readonly Bucket[] = ['breaking', 'minor', 'patch'];

const HEADING: Record<Bucket, string> = {
    breaking: '### 💥 Breaking',
    minor: '### ✨ Minor',
    patch: '### 🩹 Patch'
};

// changesets writes the plain names
const BUCKET: Record<string, Bucket> = {
    'Major Changes': 'breaking',
    'Minor Changes': 'minor',
    'Patch Changes': 'patch',
    '💥 Breaking': 'breaking',
    '✨ Minor': 'minor',
    '🩹 Patch': 'patch'
};

function sectionVersion(section: string): string | undefined {
    return section.match(/^## (\S+)/)?.[1];
}

function headingOf(section: string): string | undefined {
    return section.match(/^### (.+)/)?.[1]?.trim();
}

// a prerelease is superseded once the changelog has its stable version
function pruneSupersededPrereleases(sections: readonly string[]): string[] {
    const stable = new Set(sections.map(sectionVersion).filter((version) => version && STABLE.test(version)));
    return sections.filter((section) => {
        const base = sectionVersion(section)?.match(PRERELEASE)?.[1];
        return !(base && stable.has(base));
    });
}

function entriesOf(body: string): string[] {
    return body
        .split(ENTRY_START)
        .map((entry) => entry.replace(/\s+$/, ''))
        .filter((entry) => entry.startsWith('- '));
}

// an entry with a second paragraph needs a blank line before the next one
function joinEntries(entries: readonly string[]): string {
    return entries
        .map((entry, index) => (entry.includes('\n') && index < entries.length - 1 ? `${entry}\n` : entry))
        .join('\n');
}

// leaves a version alone when it holds anything the regroup cannot place
function regroupVersion(chunk: string): string {
    const headingEnd = chunk.indexOf('\n');
    if (headingEnd === -1) return chunk;

    const sections = chunk
        .slice(headingEnd + 1)
        .split(SECTION_START)
        .filter((section) => section.trim() !== '');
    if (sections.length === 0) return chunk;

    const buckets = new Map<Bucket, string[]>();
    for (const section of sections) {
        const heading = headingOf(section);
        const bucket = heading === undefined ? undefined : BUCKET[heading];
        const body = section.slice(section.indexOf('\n') + 1);
        if (bucket === undefined || (body.split(ENTRY_START)[0] ?? '').trim() !== '') return chunk;

        for (const entry of entriesOf(body)) {
            const breaking = entry.startsWith(MARKER);
            const target = breaking ? 'breaking' : bucket;
            buckets.set(target, [...(buckets.get(target) ?? []), breaking ? `- ${entry.slice(MARKER.length)}` : entry]);
        }
    }

    const blocks = ORDER.filter((bucket) => buckets.has(bucket)).map(
        (bucket) => `${HEADING[bucket]}\n\n${joinEntries(buckets.get(bucket) ?? [])}\n`
    );
    return `${chunk.slice(0, headingEnd)}\n\n${blocks.join('\n')}\n`;
}

export function tidyChangelog(changelog: string): string {
    const sections = pruneSupersededPrereleases(changelog.split(VERSION_START));
    return sections
        .map((section) => (section.startsWith('## ') ? regroupVersion(section) : section))
        .join('')
        .replace(/\n+$/, '\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    const changelogPath = resolve(import.meta.dirname, '..', '..', 'packages', 'envapt', 'CHANGELOG.md');
    const before = fs.readFileSync(changelogPath, 'utf-8');
    const after = tidyChangelog(before);
    if (after === before) {
        console.log('The changelog is already tidy');
    } else {
        fs.writeFileSync(changelogPath, after, 'utf-8');
        console.log(`Tidied ${changelogPath}`);
    }
}
