/* eslint-disable no-console -- justified: developer-facing CLI script */
/**
 * Enforces the workspace catalog rule:
 *   - Any dep in 2+ `package.json` files MUST be referenced via `catalog:*` in `pnpm-workspace.yaml`.
 *   - Conversely, any catalog entry MUST be referenced by 2+ packages (catalog is for shared deps;
 *     single-use entries belong inline in the package that needs them).
 *
 * Flags:
 *   - `duplicate-literal`: dep in 2+ packages with at least one pinned version
 *   - `catalog-missing-entry`: a package references `catalog:X` for a dep that isn't in any bucket
 *   - `catalog-underused`: a catalog entry referenced by `<2` packages
 *
 * Exits with code 1 on any violation. Runs in `prePush`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORKSPACE_GLOBS = ['apps', 'packages', 'mock'];
const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const;

interface DepRef {
    packageJsonPath: string;
    field: (typeof DEP_FIELDS)[number];
    version: string;
}

interface PackageJson {
    name?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
}

function findPackageJsons(): string[] {
    const out: string[] = [];

    // Workspace-root devDeps count toward the 2+ rule (turbo, husky, vitest tooling all live there).
    const rootPkg = path.join(REPO_ROOT, 'package.json');
    if (safeIsFile(rootPkg)) out.push(rootPkg);

    for (const root of WORKSPACE_GLOBS) {
        const rootPath = path.join(REPO_ROOT, root);
        if (!safeIsDir(rootPath)) continue;

        if (root === 'mock') {
            const pkg = path.join(rootPath, 'package.json');
            if (safeIsFile(pkg)) out.push(pkg);
            continue;
        }

        for (const entry of readdirSync(rootPath)) {
            const pkg = path.join(rootPath, entry, 'package.json');
            if (safeIsFile(pkg)) out.push(pkg);
        }
    }
    return out;
}

function safeIsDir(p: string): boolean {
    try {
        return statSync(p).isDirectory();
    } catch {
        return false;
    }
}

function safeIsFile(p: string): boolean {
    try {
        return statSync(p).isFile();
    } catch {
        return false;
    }
}

// Parses the `catalogs:` block from `pnpm-workspace.yaml` without a YAML lib.
// Only handles the two-space indent shape used in this repo; anything else is silently ignored.
function extractCatalogEntryName(line: string): string | undefined {
    const match = /^ {4}('[^']+'|"[^"]+"|[^:\s]+)\s*:/.exec(line);
    const captured = match?.[1];
    return captured ? captured.replace(/^['"]|['"]$/g, '') : undefined;
}

function parseCatalogEntries(): Set<string> {
    const yamlPath = path.join(REPO_ROOT, 'pnpm-workspace.yaml');
    const lines = readFileSync(yamlPath, 'utf8').split('\n');
    const entries = new Set<string>();

    let inCatalogs = false;
    let inCatalogBucket = false;

    for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, '');
        if (/^catalogs:\s*$/.test(line)) {
            inCatalogs = true;
            inCatalogBucket = false;
            continue;
        }
        if (!inCatalogs) continue;
        if (/^\S/.test(line)) {
            inCatalogs = false;
            inCatalogBucket = false;
            continue;
        }
        if (/^  \S.*:\s*$/.test(line)) {
            inCatalogBucket = true;
            continue;
        }
        if (inCatalogBucket && /^    \S/.test(line)) {
            const name = extractCatalogEntryName(line);
            if (name) entries.add(name);
        }
    }

    return entries;
}

function isInternalRef(version: string): boolean {
    return version.startsWith('workspace:') || version.startsWith('catalog:');
}

function relativeFromRepoRoot(absolutePath: string): string {
    return path.relative(REPO_ROOT, absolutePath);
}

function collectDeps(packageJsons: string[]): Map<string, DepRef[]> {
    const byName = new Map<string, DepRef[]>();
    for (const pkgPath of packageJsons) {
        const json = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson;
        for (const field of DEP_FIELDS) {
            const block = json[field];
            if (!block) continue;
            for (const [depName, version] of Object.entries(block)) {
                const list = byName.get(depName) ?? [];
                list.push({ packageJsonPath: pkgPath, field, version });
                byName.set(depName, list);
            }
        }
    }
    return byName;
}

interface Violation {
    depName: string;
    refs: DepRef[];
    reason: 'duplicate-literal' | 'catalog-missing-entry' | 'catalog-underused';
}

function findViolations(byName: Map<string, DepRef[]>, catalogEntries: Set<string>): Violation[] {
    const violations: Violation[] = [];
    const seen = new Set<string>();

    for (const [depName, refs] of byName.entries()) {
        if (refs.length < 2) continue;

        const literalRefs = refs.filter((r) => !isInternalRef(r.version));
        if (literalRefs.length > 0) {
            violations.push({ depName, refs, reason: 'duplicate-literal' });
            seen.add(depName);
            continue;
        }

        const catalogRefs = refs.filter((r) => r.version.startsWith('catalog:'));
        if (catalogRefs.length > 0 && !catalogEntries.has(depName)) {
            violations.push({ depName, refs, reason: 'catalog-missing-entry' });
            seen.add(depName);
        }
    }

    // Skip catalog entries already flagged above (don't double-report).
    for (const entryName of catalogEntries) {
        if (seen.has(entryName)) continue;
        const allRefs = byName.get(entryName) ?? [];
        const catalogRefs = allRefs.filter((r) => r.version.startsWith('catalog:'));
        const distinctPackages = new Set(catalogRefs.map((r) => r.packageJsonPath));
        if (distinctPackages.size < 2) {
            violations.push({ depName: entryName, refs: catalogRefs, reason: 'catalog-underused' });
        }
    }

    return violations;
}

function reportViolations(violations: Violation[]): void {
    if (violations.length === 0) {
        console.log('Workspace catalog check passed.');
        return;
    }

    console.error(
        `Workspace catalog check failed. ${violations.length} dep(s) violate the catalog rule.\n` +
            `See AGENTS.md "Workspace catalog rule".\n`
    );

    for (const v of violations) {
        console.error(`  • ${v.depName}  (${v.reason})`);
        for (const ref of v.refs) {
            console.error(`      ${relativeFromRepoRoot(ref.packageJsonPath)}  ${ref.field}: ${ref.version}`);
        }
        if (v.reason === 'duplicate-literal') {
            console.error(
                `      → Move "${v.depName}" into pnpm-workspace.yaml under catalogs.deps (or .peer for peerDeps),\n` +
                    `        then replace every literal version above with "catalog:deps" / "catalog:peer".`
            );
        } else if (v.reason === 'catalog-missing-entry') {
            console.error(
                `      → A package references catalog:* for "${v.depName}" but no catalog entry exists in pnpm-workspace.yaml.`
            );
        } else {
            const usedBy = v.refs.length === 0 ? '0 packages' : `${v.refs.length} package(s)`;

            console.error(
                `      → Catalog entry "${v.depName}" is used by ${usedBy}. Catalog is for shared deps (≥2 packages).\n` +
                    `        Either inline the version in the package that uses it, or remove the catalog entry.`
            );
        }
    }

    process.exit(1);
}

function main(): void {
    const packageJsons = findPackageJsons();
    const catalogEntries = parseCatalogEntries();
    const byName = collectDeps(packageJsons);
    const violations = findViolations(byName, catalogEntries);
    reportViolations(violations);
}

main();
