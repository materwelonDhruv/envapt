import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { Envapter, FileSource } from '../src';

import type { Source } from '../src';

function sourceOfFiles(files: Record<string, string>): Source {
    return {
        supportsFiles: true,
        readVars: () => ({}),
        readFile: (path) => files[path],
        resolvePath: (_baseDir, candidate) => candidate,
        normalizeBaseDir: (value) => String(value),
        writeVars: () => {}
    };
}

function loadEnvFile(contents: string): void {
    Envapter.useSource(sourceOfFiles({ 'app.env': contents }));
    Envapter.envPaths = ['app.env'];
}

describe('.env file parsing', () => {
    afterEach(() => {
        Envapter.useSource(new FileSource());
        Envapter.envFileOptions = {};
        Envapter.resetPaths();
    });

    describe('basic syntax', () => {
        it('parses KEY=VALUE pairs', () => {
            loadEnvFile('FOO=bar\nBAZ=qux');
            expect(Envapter.getRaw('FOO')).to.equal('bar');
            expect(Envapter.getRaw('BAZ')).to.equal('qux');
        });

        it('strips `export ` prefix', () => {
            loadEnvFile('export FOO=bar');
            expect(Envapter.getRaw('FOO')).to.equal('bar');
        });

        it('ignores blank lines and full-line comments', () => {
            loadEnvFile('# top\n\nFOO=bar\n   \n# trailing');
            expect(Envapter.getRaw('FOO')).to.equal('bar');
        });

        it('returns empty string for empty values', () => {
            loadEnvFile('FOO=');
            expect(Envapter.getRaw('FOO')).to.equal('');
        });

        it('trims whitespace around the value but preserves internal spaces', () => {
            loadEnvFile('FOO=  hello world  ');
            expect(Envapter.getRaw('FOO')).to.equal('hello world');
        });

        it('skips malformed lines without keys', () => {
            loadEnvFile('no equals here\nFOO=bar');
            expect(Envapter.getRaw('FOO')).to.equal('bar');
            expect(Envapter.getRaw('no equals here')).to.equal(undefined);
        });

        it('accepts CRLF line endings', () => {
            loadEnvFile('FOO=bar\r\nBAZ=qux');
            expect(Envapter.getRaw('FOO')).to.equal('bar');
            expect(Envapter.getRaw('BAZ')).to.equal('qux');
        });
    });

    describe('quoted values', () => {
        it('parses single-quoted values literally', () => {
            loadEnvFile(String.raw`FOO='hello \n world'`);
            expect(Envapter.getRaw('FOO')).to.equal(String.raw`hello \n world`);
        });

        it('parses double-quoted values with escape interpretation', () => {
            loadEnvFile(String.raw`FOO="line1\nline2\ttabbed"`);
            expect(Envapter.getRaw('FOO')).to.equal('line1\nline2\ttabbed');
        });

        it('handles all double-quote escape sequences (\\n, \\r, \\t, \\\\, \\")', () => {
            loadEnvFile(String.raw`FOO="n=\n r=\r t=\t bs=\\ q=\""`);
            expect(Envapter.getRaw('FOO')).to.equal('n=\n r=\r t=\t bs=\\ q="');
        });

        it('leaves unknown escapes intact in double quotes', () => {
            loadEnvFile(String.raw`FOO="\z literal"`);
            expect(Envapter.getRaw('FOO')).to.equal(String.raw`\z literal`);
        });

        it('parses backtick-quoted values literally', () => {
            loadEnvFile('FOO=`hello world`');
            expect(Envapter.getRaw('FOO')).to.equal('hello world');
        });

        it('skips a quote escaped by an odd number of backslashes and picks an earlier valid close', () => {
            // the parser skips the escaped last quote and closes right after `a`
            loadEnvFile(String.raw`FOO="a"\"`);
            expect(Envapter.getRaw('FOO')).to.equal('a');
        });

        it('treats a quote after an even number of backslashes as the closing quote', () => {
            loadEnvFile(String.raw`FOO="a\\"`);
            expect(Envapter.getRaw('FOO')).to.equal('a\\');
        });

        it('tolerates unescaped inner double quotes (greedy close)', () => {
            loadEnvFile('FOO="{"a":1,"b":["c"]}"');
            expect(Envapter.getRaw('FOO')).to.equal('{"a":1,"b":["c"]}');
        });

        it('parses multi-line double-quoted values', () => {
            loadEnvFile('FOO="line one\nline two"\nBAR=baz');
            expect(Envapter.getRaw('FOO')).to.equal('line one\nline two');
            expect(Envapter.getRaw('BAR')).to.equal('baz');
        });

        it('treats an unterminated quote as the rest of the file', () => {
            loadEnvFile('FOO="unterminated\nstill open');
            expect(Envapter.getRaw('FOO')).to.equal('unterminated\nstill open');
        });
    });

    describe('comments', () => {
        it('strips inline comments after a space', () => {
            loadEnvFile('FOO=bar # this is a comment');
            expect(Envapter.getRaw('FOO')).to.equal('bar');
        });

        it('does not strip `#` inside unquoted values when not preceded by whitespace', () => {
            loadEnvFile('FOO=bar#tag');
            expect(Envapter.getRaw('FOO')).to.equal('bar#tag');
        });

        it('keeps inline `#` characters inside quoted values', () => {
            loadEnvFile('FOO="bar # not a comment"');
            expect(Envapter.getRaw('FOO')).to.equal('bar # not a comment');
        });
    });

    describe('loading options', () => {
        it('lets later paths override earlier ones when override is true', () => {
            Envapter.useSource(sourceOfFiles({ 'base.env': 'KEY=first', 'local.env': 'KEY=second' }));
            Envapter.envFileOptions = { override: true };
            Envapter.envPaths = ['base.env', 'local.env'];
            expect(Envapter.getRaw('KEY')).to.equal('second');
        });

        it('decodes the file with the configured encoding', () => {
            const dir = mkdtempSync(join(tmpdir(), 'envapt-encoding-'));
            try {
                const path = join(dir, 'latin1.env');
                // 0xe9 is é in latin1 and an invalid byte in utf8
                writeFileSync(path, Buffer.concat([Buffer.from('GREETING=caf'), Buffer.from([0xe9])]));
                Envapter.envFileOptions = { encoding: 'latin1' };
                Envapter.envPaths = path;
                expect(Envapter.getRaw('GREETING')).to.equal('café');
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });
    });
});
