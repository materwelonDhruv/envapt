import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect } from 'chai';
import * as ts from 'typescript';
import { describe, it } from 'vitest';

/**
 * Compile-time TS error verification via the TypeScript compiler API. Neither `expect-type`
 * nor `tsd` checks the TEXT of a diagnostic message, only that an error is produced. The
 * branded `Err<...>` pattern relies on a specific literal appearing in TS's "no overload
 * matches" chain, so we run `tsc` directly against fixtures and assert message fragments.
 *
 * Fixtures live in `tests/type-error-fixtures/` and are excluded from both the package's
 * tsconfig and eslint. A dedicated tsconfig inside that directory exists so the IDE shows
 * the same diagnostic this test sees (a default tsconfig would emit TS1206 for the
 * decorators and mask the actual error).
 */

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = resolve(TEST_DIR, 'type-error-fixtures');
const PROJECT_ROOT = resolve(TEST_DIR, '..');
const FIXTURE_TIMEOUT_MS = 10_000;

interface ParsedDiagnostic {
    code: number;
    line: number;
    message: string;
}

function compileFixture(fixtureRelativePath: string): ParsedDiagnostic[] {
    const fixturePath = resolve(FIXTURE_DIR, fixtureRelativePath);

    const configFileName = resolve(PROJECT_ROOT, 'tsconfig.json');
    const configFile = ts.readConfigFile(configFileName, (path) => readFileSync(path, 'utf8'));
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, PROJECT_ROOT);

    const program = ts.createProgram({
        rootNames: [fixturePath],
        options: { ...parsed.options, noEmit: true }
    });

    return ts
        .getPreEmitDiagnostics(program)
        .filter((d) => d.file?.fileName === fixturePath)
        .map((d) => {
            const pos =
                d.file && d.start !== undefined
                    ? d.file.getLineAndCharacterOfPosition(d.start)
                    : { line: -1, character: -1 };
            return {
                code: d.code,
                line: pos.line + 1,
                message: ts.flattenDiagnosticMessageText(d.messageText, '\n')
            };
        });
}

function joinedMessages(diagnostics: readonly ParsedDiagnostic[]): string {
    return diagnostics.map((d) => `TS${d.code}: ${d.message}`).join('\n');
}

describe('TS error message verification (compiler API)', () => {
    it(
        'baseline: valid fixture compiles cleanly (proves experimentalDecorators is picked up)',
        { timeout: FIXTURE_TIMEOUT_MS },
        () => {
            const diagnostics = compileFixture('clean-baseline.ts');
            if (diagnostics.length > 0) {
                // Surface the actual diagnostics so a harness misconfiguration is visible.
                throw new Error(
                    `clean-baseline.ts should compile cleanly but produced:\n${joinedMessages(diagnostics)}`
                );
            }
        }
    );

    describe('dotenvConfig forbidden fields surface the branded explanation', () => {
        it(
            '`path` rejection is TS2322 with the explanation literal in the message',
            { timeout: FIXTURE_TIMEOUT_MS },
            () => {
                const diagnostics = compileFixture('dotenv-path-forbidden.ts');
                expect(diagnostics).to.have.lengthOf(1);

                const [diagnostic] = diagnostics;
                if (!diagnostic) throw new Error('expected exactly one diagnostic');
                expect(diagnostic.code, 'expected TS2322 (type-not-assignable)').to.equal(2322);
                expect(diagnostic.message).to.include('`path` is managed by Envapter');
                expect(diagnostic.message).to.include('Envapter.envPaths');
            }
        );

        it(
            '`processEnv` rejection is TS2322 with the explanation literal in the message',
            { timeout: FIXTURE_TIMEOUT_MS },
            () => {
                const diagnostics = compileFixture('dotenv-process-env-forbidden.ts');
                expect(diagnostics).to.have.lengthOf(1);

                const [diagnostic] = diagnostics;
                if (!diagnostic) throw new Error('expected exactly one diagnostic');
                expect(diagnostic.code, 'expected TS2322 (type-not-assignable)').to.equal(2322);
                expect(diagnostic.message).to.include('`processEnv` is managed internally by Envapter');
            }
        );
    });

    describe('decorator `required: true` + `fallback` mutex produces the branded compile error', () => {
        // Asserting the specific code (TS2769) means a misconfigured compiler that emits
        // a different code (e.g. TS1206 from missing experimentalDecorators) fails the test
        // instead of silently passing on "any error was produced."
        it(
            'produces exactly one TS2769 diagnostic carrying the branded mutex literal',
            { timeout: FIXTURE_TIMEOUT_MS },
            () => {
                const diagnostics = compileFixture('required-fallback-mutex.ts');
                expect(diagnostics).to.have.lengthOf(1);

                const [diagnostic] = diagnostics;
                if (!diagnostic) throw new Error('expected exactly one diagnostic');
                expect(diagnostic.code, 'expected TS2769 (no-overload-matches)').to.equal(2769);
                expect(diagnostic.message).to.include('No overload matches this call');
                expect(diagnostic.message).to.include('RequiredAndFallbackMutex');
                expect(diagnostic.message).to.include('`required: true` and `fallback` are mutually exclusive');
                expect(diagnostic.message).to.include('Envapter.require()');
            }
        );
    });
});
