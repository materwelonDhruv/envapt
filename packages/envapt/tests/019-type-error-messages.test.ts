import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

// expect-type and tsd do not check diagnostic text. the SchemaMustBeSync brand puts its message there.
// type-error-fixtures has its own tsconfig so the IDE shows the same diagnostics as this test.

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = resolve(TEST_DIR, 'type-error-fixtures');
const PROJECT_ROOT = resolve(TEST_DIR, '..');
const FIXTURE_TIMEOUT_MS = 10_000;

interface ParsedDiagnostic {
    code: number;
    line: number;
    message: string;
}

// one program per fixture would reload the libs and re-check all of src every time
const diagnosticsByDir = new Map<string, Map<string, ParsedDiagnostic[]>>();

function diagnosticsForDir(fixtureDir: string, configFileName: string): Map<string, ParsedDiagnostic[]> {
    const cached = diagnosticsByDir.get(fixtureDir);
    if (cached) return cached;

    const configFile = ts.readConfigFile(configFileName, (path) => readFileSync(path, 'utf8'));
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, dirname(configFileName));
    const rootNames = readdirSync(fixtureDir)
        .filter((name) => name.endsWith('.ts'))
        .map((name) => resolve(fixtureDir, name));

    const program = ts.createProgram({ rootNames, options: { ...parsed.options, noEmit: true } });

    const byFile = new Map<string, ParsedDiagnostic[]>();
    for (const d of ts.getPreEmitDiagnostics(program)) {
        if (!d.file) continue;
        const pos = d.start === undefined ? { line: -1, character: -1 } : d.file.getLineAndCharacterOfPosition(d.start);
        const entry: ParsedDiagnostic = {
            code: d.code,
            line: pos.line + 1,
            message: ts.flattenDiagnosticMessageText(d.messageText, '\n')
        };
        const list = byFile.get(d.file.fileName);
        if (list) list.push(entry);
        else byFile.set(d.file.fileName, [entry]);
    }

    diagnosticsByDir.set(fixtureDir, byFile);
    return byFile;
}

function compileFixture(
    fixtureRelativePath: string,
    configFileName: string = resolve(PROJECT_ROOT, 'tsconfig.json')
): ParsedDiagnostic[] {
    const fixturePath = resolve(FIXTURE_DIR, fixtureRelativePath);
    return diagnosticsForDir(dirname(fixturePath), configFileName).get(fixturePath) ?? [];
}

function joinedMessages(diagnostics: readonly ParsedDiagnostic[]): string {
    return diagnostics.map((d) => `TS${d.code}: ${d.message}`).join('\n');
}

describe('TS error message verification (compiler API)', () => {
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

    describe('an async schema field in a getRequiredAll spec produces the SchemaMustBeSync compile error', () => {
        it('carries it for a field typed as an async schema or a converter', { timeout: FIXTURE_TIMEOUT_MS }, () => {
            const diagnostics = compileFixture('required-all-schema-union-must-be-sync.ts');
            expect(diagnostics).to.have.lengthOf(1);
            expect(joinedMessages(diagnostics)).to.include('Schema must be synchronous');
        });
    });

    describe('with strict off', () => {
        const NON_STRICT_CONFIG = resolve(FIXTURE_DIR, 'non-strict/tsconfig.json');

        it('keeps getRequiredAll keys as-is with no casing', { timeout: FIXTURE_TIMEOUT_MS }, () => {
            const diagnostics = compileFixture('non-strict/required-all-keys.ts', NON_STRICT_CONFIG);
            expect(diagnostics, joinedMessages(diagnostics)).to.have.lengthOf(0);
        });

        it('types a number-fallback decorator field as a number', { timeout: FIXTURE_TIMEOUT_MS }, () => {
            const diagnostics = compileFixture('non-strict/fallback-only-field.ts', NON_STRICT_CONFIG);
            expect(diagnostics, joinedMessages(diagnostics)).to.have.lengthOf(0);
        });
    });

    describe('modern accessor decorator constrains the declared field type to the converter output', () => {
        const MODERN_CONFIG = resolve(FIXTURE_DIR, 'modern/tsconfig.json');

        it('rejects mismatched accessor types across the @Envapt overloads', { timeout: FIXTURE_TIMEOUT_MS }, () => {
            const diagnostics = compileFixture('modern/accessor-overloads-mismatch.ts', MODERN_CONFIG);
            const fieldErrors = diagnostics.filter((d) => d.code === 1240);
            expect(fieldErrors.length, joinedMessages(diagnostics)).to.be.greaterThanOrEqual(6);
            expect(joinedMessages(diagnostics)).to.include('[envapt] field type must hold the converter output');
        });

        it(
            'accepts correct and wider accessor types across the @Envapt overloads',
            { timeout: FIXTURE_TIMEOUT_MS },
            () => {
                const diagnostics = compileFixture('modern/accessor-overloads-clean.ts', MODERN_CONFIG);
                expect(diagnostics, joinedMessages(diagnostics)).to.have.lengthOf(0);
            }
        );

        it('rejects an empty @Envapt options object', { timeout: FIXTURE_TIMEOUT_MS }, () => {
            const diagnostics = compileFixture('modern/empty-options.ts', MODERN_CONFIG);
            expect(
                diagnostics.some((d) => d.code === 2769),
                joinedMessages(diagnostics)
            ).to.be.true;
        });

        it('rejects an object fallback with no converter', { timeout: FIXTURE_TIMEOUT_MS }, () => {
            const diagnostics = compileFixture('modern/fallback-only-object.ts', MODERN_CONFIG);
            expect(
                diagnostics.some((d) => d.code === 2769),
                joinedMessages(diagnostics)
            ).to.be.true;
        });
    });
});
