import { execFile, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const pexec = promisify(execFile);

// eslint-disable-next-line no-magic-numbers -- 64 MiB cap so a verbose suite's captured output is not truncated
const captureBytes = 64 * 1024 * 1024;

// build first because every slice below reads the built dist
process.stdout.write('── build ──\n');
execFileSync('pnpm', ['--filter', 'envapt', 'build'], { stdio: 'inherit' });

const playwrightCache = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    join(homedir(), '.cache/ms-playwright'),
    join(homedir(), 'Library/Caches/ms-playwright'),
    join(homedir(), 'AppData/Local/ms-playwright')
].filter((dir) => dir && dir !== '0');
const hasChromium = playwrightCache.some(existsSync);

const slices = [
    ['unit', ['--filter', 'envapt', 'test']],
    ['integration', ['--filter', 'envapt', 'test:integration']],
    ['workerd', ['--filter', 'envapt', 'test:workers']],
    ['consumer-build', ['--filter', 'envapt', 'test:consumer-build']],
    ['tree-shaking', ['--filter', 'envapt', 'test:tree-shaking']],
    ['exports-dedup', ['--filter', 'envapt', 'test:exports-dedup']],
    ['cjs-validity', ['--filter', 'envapt', 'test:cjs-validity']],
    ['tsc-emit', ['--filter', 'envapt', 'test:tsc-emit']],
    ['stage3-emit', ['--filter', 'envapt', 'test:stage3-emit']]
];
if (hasChromium) slices.push(['browser', ['--filter', 'envapt', 'test:browser']]);

// each slice is its own process with no shared state, so they can run in parallel
const results = await Promise.all(
    slices.map(async ([label, args]) => {
        try {
            const { stdout, stderr } = await pexec('pnpm', args, { maxBuffer: captureBytes });
            return { label, ok: true, output: stdout + stderr };
        } catch (err) {
            return { label, ok: false, output: String(err.stdout ?? '') + String(err.stderr ?? '') };
        }
    })
);

let failed = 0;
for (const result of results) {
    process.stdout.write(`\n══ ${result.label} ${result.ok ? 'PASS' : 'FAIL'} ══\n`);
    process.stdout.write(result.output);
    if (!result.ok) failed += 1;
}

if (!hasChromium) {
    process.stdout.write('\n══ browser SKIPPED ══\n');
    process.stdout.write('run `pnpm --filter envapt exec playwright install chromium` to enable it\n');
}

process.stdout.write(`\ntest:all: ${results.length - failed}/${results.length} suites passed\n`);
if (failed > 0) process.exit(1);
