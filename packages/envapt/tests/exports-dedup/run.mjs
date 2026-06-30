// Build gate. A public name must resolve to a single declaration across the runtime entry points so
// an editor offers a single auto-import per name across the runtime builds.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const here = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(here, '..', '..');
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));

// Envapter is the one exception because its Node (NodeEnvapter) and portable surfaces deliberately differ
const ALLOWED_TO_DIFFER = new Set(['Envapter']);

function collectTypesFiles(entry, out = new Set()) {
    if (typeof entry === 'string') return out;
    for (const [key, value] of Object.entries(entry)) {
        if (key === 'types' && typeof value === 'string') out.add(resolve(pkgDir, value));
        else if (value && typeof value === 'object') collectTypesFiles(value, out);
    }
    return out;
}

const groups = {
    index: collectTypesFiles(pkg.exports['.']),
    legacy: collectTypesFiles(pkg.exports['./legacy'])
};

const allFiles = [...new Set([...groups.index, ...groups.legacy])];
const program = ts.createProgram(allFiles, {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ESNext,
    skipLibCheck: true,
    noEmit: true
});
const checker = program.getTypeChecker();

function originFile(symbol) {
    let resolved = symbol;
    if (resolved.flags & ts.SymbolFlags.Alias) resolved = checker.getAliasedSymbol(resolved);
    return resolved.declarations?.[0]?.getSourceFile().fileName;
}

function exportOrigins(files) {
    const origins = new Map();
    for (const file of files) {
        const source = program.getSourceFile(file);
        assert.ok(source, `entry types file not found (build first?): ${file}`);
        const moduleSymbol = checker.getSymbolAtLocation(source);
        assert.ok(moduleSymbol, `no module symbol for ${file}`);
        for (const exp of checker.getExportsOfModule(moduleSymbol)) {
            const origin = originFile(exp);
            if (!origin) continue;
            if (!origins.has(exp.name)) origins.set(exp.name, new Set());
            origins.get(exp.name).add(origin);
        }
    }
    return origins;
}

const violations = [];
for (const [group, files] of Object.entries(groups)) {
    for (const [name, origins] of exportOrigins(files)) {
        if (origins.size > 1 && !ALLOWED_TO_DIFFER.has(name)) {
            violations.push(
                `${group}: "${name}" resolves to ${origins.size} declarations:\n    ${[...origins].map((f) => f.replace(`${pkgDir}/`, '')).join('\n    ')}`
            );
        }
    }
}

if (violations.length > 0) {
    process.stderr.write(
        `exports-dedup: ${violations.length} name(s) duplicate across runtime entry points:\n  ${violations.join('\n  ')}\n`
    );
    process.exit(1);
}
process.stdout.write(
    'exports-dedup: every public name resolves to a single declaration across runtime entry points.\n'
);
