import process from 'node:process';

import basicGet from './suites/01-basic-get.mjs';
import converters from './suites/02-converters.mjs';
import fallbacks from './suites/03-fallbacks.mjs';
import missingFile from './suites/04-missing-file.mjs';
import decorator from './suites/05-decorator.mjs';
import v5Features from './suites/06-v5-features.mjs';

const suites = [
    ['01-basic-get', basicGet],
    ['02-converters', converters],
    ['03-fallbacks', fallbacks],
    ['04-missing-file', missingFile],
    ['05-decorator', decorator],
    ['06-v5-features', v5Features]
];

const runtime = detectRuntime();
process.stdout.write(`[integration] runtime=${runtime}\n`);

// Bun 1.3.10+ ignores `experimentalDecorators` (bun#27575) and emits Stage 3, which
// envapt's legacy decorator helper can't accept. The Deno deprecation warning is the
// canary: when Deno removes the flag, this suite will break.
if (runtime === 'deno') {
    const mod = await import('./suites/05b-decorator-syntax.ts');
    suites.push(['05b-decorator-syntax', mod.default]);
}

let failed = 0;
for (const [name, fn] of suites) {
    try {
        await fn();
        process.stdout.write(`  ✓ ${name}\n`);
    } catch (err) {
        failed++;
        const stack = err instanceof Error ? (err.stack ?? err.message) : String(err);
        process.stderr.write(`  ✗ ${name}\n${stack}\n`);
    }
}

if (failed > 0) {
    process.stderr.write(`[integration] ${failed} suite(s) failed\n`);
    process.exit(1);
}
process.stdout.write(`[integration] all ${suites.length} suites passed\n`);

function detectRuntime() {
    if (typeof Deno !== 'undefined') return 'deno';
    if (typeof Bun !== 'undefined') return 'bun';
    return 'node';
}
