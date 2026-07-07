import process from 'node:process';

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
