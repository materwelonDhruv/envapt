import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * Compile-time TS error verification via the TypeScript compiler API. Neither `expect-type`
 * nor `tsd` checks the TEXT of a diagnostic message, only that an error is produced. The
 * SchemaMustBeSync brand relies on a specific literal appearing in the diagnostic, so we run
 * `tsc` directly against fixtures and assert message fragments.
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

function compileFixture(
    fixtureRelativePath: string,
    configFileName: string = resolve(PROJECT_ROOT, 'tsconfig.json')
): ParsedDiagnostic[] {
    const fixturePath = resolve(FIXTURE_DIR, fixtureRelativePath);

    const configFile = ts.readConfigFile(configFileName, (path) => readFileSync(path, 'utf8'));
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, dirname(configFileName));

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

    describe('async-validating schema produces the SchemaMustBeSync branded compile error', () => {
        it(
            'produces a TS2769 diagnostic carrying the SchemaMustBeSync literal',
            { timeout: FIXTURE_TIMEOUT_MS },
            () => {
                const diagnostics = compileFixture('schema-must-be-sync.ts');
                expect(diagnostics).to.have.lengthOf(1);

                const [diagnostic] = diagnostics;
                if (!diagnostic) throw new Error('expected exactly one diagnostic');
                expect(diagnostic.code, 'expected TS2769 (no-overload-matches)').to.equal(2769);
                expect(diagnostic.message).to.include('No overload matches this call');
                expect(diagnostic.message).to.include('SchemaMustBeSync');
                expect(diagnostic.message).to.include('Schema must be synchronous');
            }
        );
    });

    describe('removed positional @Envapt form produces a no-overload compile error', () => {
        it('produces a TS2769 diagnostic for a primitive second argument', { timeout: FIXTURE_TIMEOUT_MS }, () => {
            const diagnostics = compileFixture('positional-removed.ts');
            const has2769 = diagnostics.some((d) => d.code === 2769);
            expect(has2769, joinedMessages(diagnostics)).to.be.true;
            expect(joinedMessages(diagnostics)).to.include('No overload matches this call');
        });
    });

    describe('legacy decorator constrains the declared field type to the converter output', () => {
        it('rejects a field whose type cannot hold the converter output', { timeout: FIXTURE_TIMEOUT_MS }, () => {
            const diagnostics = compileFixture('field-type-mismatch.ts');
            const has1240 = diagnostics.some((d) => d.code === 1240);
            expect(has1240, joinedMessages(diagnostics)).to.be.true;
        });

        it(
            'rejects a non-null field for a no-fallback decorator (the value can be null)',
            { timeout: FIXTURE_TIMEOUT_MS },
            () => {
                const diagnostics = compileFixture('field-type-no-fallback.ts');
                const has1240 = diagnostics.some((d) => d.code === 1240);
                expect(has1240, joinedMessages(diagnostics)).to.be.true;
            }
        );

        it('rejects mismatched field types across the @Envapt overloads', { timeout: FIXTURE_TIMEOUT_MS }, () => {
            const diagnostics = compileFixture('envapt-overloads-mismatch.ts');
            const fieldErrors = diagnostics.filter((d) => d.code === 1240);
            expect(fieldErrors.length, joinedMessages(diagnostics)).to.be.greaterThanOrEqual(6);
        });

        it(
            'accepts correct and wider field types across the @Envapt overloads',
            { timeout: FIXTURE_TIMEOUT_MS },
            () => {
                const diagnostics = compileFixture('envapt-overloads-clean.ts');
                expect(diagnostics, joinedMessages(diagnostics)).to.have.lengthOf(0);
            }
        );
    });

    describe('modern accessor decorator constrains the declared field type to the converter output', () => {
        const MODERN_CONFIG = resolve(FIXTURE_DIR, 'modern/tsconfig.json');

        it('rejects an accessor whose type cannot hold the converter output', { timeout: FIXTURE_TIMEOUT_MS }, () => {
            const diagnostics = compileFixture('modern/accessor-field-type-mismatch.ts', MODERN_CONFIG);
            const has1240 = diagnostics.some((d) => d.code === 1240);
            expect(has1240, joinedMessages(diagnostics)).to.be.true;
            expect(joinedMessages(diagnostics)).to.include('[envapt] field type must hold the converter output');
        });

        it(
            'rejects a non-null accessor for a no-fallback decorator (the value can be null)',
            { timeout: FIXTURE_TIMEOUT_MS },
            () => {
                const diagnostics = compileFixture('modern/accessor-field-type-no-fallback.ts', MODERN_CONFIG);
                expect(
                    diagnostics.some((d) => d.code === 1240),
                    joinedMessages(diagnostics)
                ).to.be.true;
            }
        );

        it('rejects mismatched accessor types across the @Envapt overloads', { timeout: FIXTURE_TIMEOUT_MS }, () => {
            const diagnostics = compileFixture('modern/accessor-overloads-mismatch.ts', MODERN_CONFIG);
            const fieldErrors = diagnostics.filter((d) => d.code === 1240);
            expect(fieldErrors.length, joinedMessages(diagnostics)).to.be.greaterThanOrEqual(6);
        });

        it(
            'accepts correct and wider accessor types across the @Envapt overloads',
            { timeout: FIXTURE_TIMEOUT_MS },
            () => {
                const diagnostics = compileFixture('modern/accessor-overloads-clean.ts', MODERN_CONFIG);
                expect(diagnostics, joinedMessages(diagnostics)).to.have.lengthOf(0);
            }
        );
    });
});
