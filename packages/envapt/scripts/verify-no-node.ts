// Build gate, the portable build must stay node-free and keep the file-API guards.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const TARGETS = ['portable'] as const;
const FILE_APIS = ['envPaths', 'baseDir', 'envFileOptions', 'configureProfiles', 'resetProfiles'] as const;

// `from "node:fs"`, `import("node:url")`, `require("node:path")`, the quotes keep prose `node:fs` out.
const NODE_SPECIFIER = /['"]node:[\w/.-]+['"]/;
// `processEnv` has no dot so it stays clean, import.meta.url/.env are web-standard and intentionally unmatched.
const RUNTIME_NODE =
    /\bprocess\.\w+|\bBuffer\b|\b__dirname\b|\b__filename\b|globalThis\.process|import\.meta\.(?:dirname|filename)|\b(?:readFileSync|writeFileSync|existsSync|accessSync|fileURLToPath)\b/;

interface PortableEnvaptError extends Error {
    code: number;
}
interface PortableModule {
    Envapter: Record<string, unknown>;
    EnvaptError: new (...args: never[]) => PortableEnvaptError;
    EnvaptErrorCodes: { FileApiUnsupported: number };
}

function fail(message: string): never {
    process.stderr.write(`${message}\n`);
    process.exit(1);
}

function selfTest(): void {
    const runtimeCases: [string, boolean][] = [
        ['a=process.env.FOO', true],
        ['process.cwd()', true],
        ['fs.readFileSync(p)', true],
        ['Buffer.from(x)', true],
        ['x=__dirname', true],
        ['globalThis.process.exit()', true],
        ['import.meta.dirname', true],
        ['mirrored KEY to the ambient environment', false],
        ['processEnv: isolatedEnv', false],
        ['import.meta.url', false]
    ];
    const specifierCases: [string, boolean][] = [
        ['import x from"node:fs"', true],
        ['see `node:fs` for details', false]
    ];
    for (const [input, expected] of runtimeCases) {
        if (RUNTIME_NODE.test(input) !== expected) fail(`verify-no-node self-test failed (runtime) on: ${input}`);
    }
    for (const [input, expected] of specifierCases) {
        if (NODE_SPECIFIER.test(input) !== expected) fail(`verify-no-node self-test failed (specifier) on: ${input}`);
    }
}

function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else if (!entry.name.endsWith('.map')) out.push(full);
    }
    return out;
}

function isDeclaration(file: string): boolean {
    return file.endsWith('.d.mts') || file.endsWith('.d.cts') || file.endsWith('.d.ts');
}

function isCode(file: string): boolean {
    return ['.mjs', '.cjs', '.js'].includes(extname(file));
}

// Declaration files skip RUNTIME_NODE because TSDoc prose legitimately mentions `process.env`/`node:fs`.
// Runtime files are safe to full-scan because the build minifies them (no comments survive).
function grepGate(): void {
    const violations: string[] = [];
    let scanned = 0;
    for (const target of TARGETS) {
        for (const file of walk(join(DIST, target))) {
            const declaration = isDeclaration(file);
            if (!declaration && !isCode(file)) continue;
            scanned++;
            readFileSync(file, 'utf8')
                .split('\n')
                .forEach((line, i) => {
                    if (NODE_SPECIFIER.test(line))
                        violations.push(`${file}:${i + 1} node: specifier -> ${line.trim()}`);
                    if (!declaration && RUNTIME_NODE.test(line)) {
                        violations.push(`${file}:${i + 1} node runtime API -> ${line.trim()}`);
                    }
                });
        }
    }
    if (violations.length > 0) {
        fail(`verify-no-node: ${violations.length} Node coupling(s) in portable:\n  ${violations.join('\n  ')}`);
    }
    process.stdout.write(`verify-no-node: ${scanned} portable files clean (no node:* / node globals).\n`);
}

// Guards against an entry shipping without the stubs (e.g. a re-exported side effect tree-shaken away),
// which would no-op the file APIs for JS callers that bypass the types.
async function stubProof(): Promise<void> {
    for (const target of TARGETS) {
        const url = pathToFileURL(join(DIST, target, 'index.mjs')).href;
        // justified: a dynamic import of a built artifact has no static type
        const mod = (await import(url)) as PortableModule;
        const { Envapter, EnvaptError } = mod;
        const code = mod.EnvaptErrorCodes.FileApiUnsupported;
        const is306 = (error: unknown): boolean => error instanceof EnvaptError && error.code === code;
        for (const api of FILE_APIS) {
            assert.throws(
                () => Envapter[api],
                is306,
                `${target}: reading Envapter.${api} must throw FileApiUnsupported`
            );
            assert.throws(
                () => {
                    Envapter[api] = undefined;
                },
                is306,
                `${target}: setting Envapter.${api} must throw FileApiUnsupported`
            );
        }
    }
    process.stdout.write('verify-no-node: portable file-API stubs throw FileApiUnsupported (306).\n');
}

// Generated at runtime, not checked in. It imports built artifacts absent at `tc` time. A dts
// regression that re-adds a file API leaves a fixture suppression unused, so tsc errors.
function omissionProof(): void {
    const localRequire = createRequire(import.meta.url);
    const tscPath = join(dirname(localRequire.resolve('typescript/package.json')), 'lib', 'tsc.js');
    const dir = mkdtempSync(join(tmpdir(), 'envapt-omission-'));
    const fixture = join(dir, 'check.mts');
    const omit = (alias: string, api: string): string =>
        `// @ts-expect-error ${api} is omitted from the portable Envapter\nvoid ${alias}.${api};`;
    const body = [
        `import { Envapter as P } from ${JSON.stringify(join(DIST, 'types', 'index.portable.mjs'))};`,
        `import { Envapter as N } from ${JSON.stringify(join(DIST, 'types', 'index.mjs'))};`,
        ...FILE_APIS.map((api) => omit('P', api)),
        'void P.useSource;',
        ...FILE_APIS.map((api) => `void N.${api};`)
    ].join('\n');
    writeFileSync(fixture, `${body}\n`);
    try {
        execFileSync(
            process.execPath,
            [
                tscPath,
                '--ignoreConfig',
                '--noEmit',
                '--strict',
                '--skipLibCheck',
                '--module',
                'esnext',
                '--moduleResolution',
                'bundler',
                '--target',
                'es2022',
                fixture
            ],
            { stdio: 'pipe' }
        );
    } catch (error) {
        const detail =
            typeof error === 'object' && error !== null && 'stdout' in error ? String(error.stdout) : String(error);
        rmSync(dir, { recursive: true, force: true });
        fail(`verify-no-node: dist type-omission proof failed (portable Envapter must omit the file APIs):\n${detail}`);
    }
    rmSync(dir, { recursive: true, force: true });
    process.stdout.write(
        'verify-no-node: dist type-omission proof passed (portable Envapter type omits the 5 file APIs).\n'
    );
}

// The public types are all emitted to dist/types, shims-free, so no entry carries a node:* import. A
// leak here would reach portable consumers without appearing in the portable grep above.
function typesNodeFreeProof(): void {
    const violations: string[] = [];
    for (const file of walk(join(DIST, 'types'))) {
        if (!isDeclaration(file)) continue;
        readFileSync(file, 'utf8')
            .split('\n')
            .forEach((line, i) => {
                if (NODE_SPECIFIER.test(line)) violations.push(`${file}:${i + 1} node: specifier -> ${line.trim()}`);
            });
    }
    if (violations.length > 0) {
        fail(
            `verify-no-node: ${violations.length} node coupling(s) in dist/types declarations:\n  ${violations.join('\n  ')}`
        );
    }
    process.stdout.write('verify-no-node: dist/types declarations are node-free.\n');
}

selfTest();
grepGate();
typesNodeFreeProof();
await stubProof();
omissionProof();
