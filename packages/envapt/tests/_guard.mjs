import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import process from 'node:process';

const require = createRequire(import.meta.url);

// typescript@7's exports map blocks the deep bin path.
// A non-default package gets its own outDir because turbo can run both suites concurrently.
export function resolveTsc(here) {
    const pkg = process.env.ENVAPT_TSC_PACKAGE ?? 'typescript';
    const manifestPath = require.resolve(`${pkg}/package.json`);
    // eslint-disable-next-line security/detect-non-literal-require -- pkg is a fixed env switch, typescript or typescript7
    const manifest = require(manifestPath);
    return {
        tsc: join(dirname(manifestPath), manifest.bin.tsc),
        outDir: join(here, pkg === 'typescript' ? 'out' : `out-${pkg}`)
    };
}

// Shared scaffolding for the post-build guard scripts. Each runs as its own process after the build and
// exits non-zero from done() so CI gates on the result.
export function createGate(name) {
    const failures = [];
    return {
        pass: (detail) => process.stdout.write(`${name} ${detail}\n`),
        fail: (detail) => failures.push(detail),
        check(label, actual, expected) {
            if (actual === expected) process.stdout.write(`${name} ${label}: OK (${actual})\n`);
            else failures.push(`${label}: expected ${expected}, got ${String(actual)}`);
        },
        done(successMessage) {
            if (failures.length > 0) {
                process.stderr.write(`${name}: ${failures.length} failure(s)\n  ${failures.join('\n  ')}\n`);
                process.exit(1);
            }
            process.stdout.write(`${name}: ${successMessage}\n`);
        }
    };
}
