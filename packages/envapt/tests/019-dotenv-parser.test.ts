import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { FileSource } from '../src';
import { loadDotenv, parseDotenv } from '../src/infra/Dotenv';

// loadDotenv takes an injected reader; reuse the library's Node reader rather than re-implementing fs.
const reader = new FileSource();
const nodeReadFile = reader.readFile.bind(reader);

describe('Dotenv parser', () => {
    describe('parseDotenv — basic syntax', () => {
        it('parses KEY=VALUE pairs', () => {
            const result = parseDotenv('FOO=bar\nBAZ=qux');
            expect(result.get('FOO')).to.equal('bar');
            expect(result.get('BAZ')).to.equal('qux');
        });

        it('strips `export ` prefix', () => {
            const result = parseDotenv('export FOO=bar');
            expect(result.get('FOO')).to.equal('bar');
        });

        it('ignores blank lines and full-line comments', () => {
            const result = parseDotenv('# top\n\nFOO=bar\n   \n# trailing');
            expect(result.size).to.equal(1);
            expect(result.get('FOO')).to.equal('bar');
        });

        it('returns empty string for empty values', () => {
            const result = parseDotenv('FOO=');
            expect(result.get('FOO')).to.equal('');
        });

        it('trims whitespace around the value but preserves internal spaces', () => {
            const result = parseDotenv('FOO=  hello world  ');
            expect(result.get('FOO')).to.equal('hello world');
        });

        it('skips malformed lines without keys', () => {
            const result = parseDotenv('no equals here\nFOO=bar');
            expect(result.size).to.equal(1);
            expect(result.get('FOO')).to.equal('bar');
        });

        it('accepts CRLF line endings', () => {
            const result = parseDotenv('FOO=bar\r\nBAZ=qux');
            expect(result.get('FOO')).to.equal('bar');
            expect(result.get('BAZ')).to.equal('qux');
        });
    });

    describe('parseDotenv — quoted values', () => {
        it('parses single-quoted values literally', () => {
            const result = parseDotenv(String.raw`FOO='hello \n world'`);
            expect(result.get('FOO')).to.equal(String.raw`hello \n world`);
        });

        it('parses double-quoted values with escape interpretation', () => {
            const result = parseDotenv(String.raw`FOO="line1\nline2\ttabbed"`);
            expect(result.get('FOO')).to.equal('line1\nline2\ttabbed');
        });

        it('handles all double-quote escape sequences (\\n, \\r, \\t, \\\\, \\")', () => {
            const result = parseDotenv(String.raw`FOO="n=\n r=\r t=\t bs=\\ q=\""`);
            expect(result.get('FOO')).to.equal('n=\n r=\r t=\t bs=\\ q="');
        });

        it('leaves unknown escapes intact in double quotes', () => {
            const result = parseDotenv(String.raw`FOO="\z literal"`);
            expect(result.get('FOO')).to.equal(String.raw`\z literal`);
        });

        it('parses backtick-quoted values literally', () => {
            const result = parseDotenv('FOO=`hello world`');
            expect(result.get('FOO')).to.equal('hello world');
        });

        it('skips a quote escaped by an odd number of backslashes and picks an earlier valid close', () => {
            // Buffer: opening `"`, `a`, closing `"`, then `\"` (escaped trailing quote).
            // The rightmost `"` is escaped (one `\` before it), so the parser must walk back
            // and pick the earlier closing `"` at index 2.
            const result = parseDotenv(String.raw`FOO="a"\"`);
            expect(result.get('FOO')).to.equal('a');
        });

        it('treats a quote after an even number of backslashes as the closing quote', () => {
            // Buffer is `"a\\"` (raw): opening, `a`, two literal backslashes (escape for `\`),
            // closing quote. The backslash counter has to walk through both `\` before deciding
            // the closing `"` is unescaped.
            const result = parseDotenv(String.raw`FOO="a\\"`);
            expect(result.get('FOO')).to.equal('a\\');
        });

        it('tolerates unescaped inner double quotes (greedy close)', () => {
            const result = parseDotenv('FOO="{"a":1,"b":["c"]}"');
            expect(result.get('FOO')).to.equal('{"a":1,"b":["c"]}');
        });

        it('parses multi-line double-quoted values', () => {
            const result = parseDotenv('FOO="line one\nline two"\nBAR=baz');
            expect(result.get('FOO')).to.equal('line one\nline two');
            expect(result.get('BAR')).to.equal('baz');
        });

        it('treats an unterminated quote as the rest of the file', () => {
            const result = parseDotenv('FOO="unterminated\nstill open');
            expect(result.get('FOO')).to.equal('unterminated\nstill open');
        });
    });

    describe('parseDotenv — comments', () => {
        it('strips inline comments after a space', () => {
            const result = parseDotenv('FOO=bar # this is a comment');
            expect(result.get('FOO')).to.equal('bar');
        });

        it('does not strip `#` inside unquoted values when not preceded by whitespace', () => {
            const result = parseDotenv('FOO=bar#tag');
            expect(result.get('FOO')).to.equal('bar#tag');
        });

        it('keeps inline `#` characters inside quoted values', () => {
            const result = parseDotenv('FOO="bar # not a comment"');
            expect(result.get('FOO')).to.equal('bar # not a comment');
        });
    });

    describe('loadDotenv — file loading', () => {
        let tmpDir: string;
        const written: string[] = [];

        beforeAll(() => {
            tmpDir = mkdtempSync(join(tmpdir(), 'envapt-dotenv-'));
        });

        afterAll(() => {
            rmSync(tmpDir, { recursive: true, force: true });
        });

        function writeEnv(filename: string, contents: string): string {
            const fullPath = join(tmpDir, filename);
            writeFileSync(fullPath, contents);
            written.push(fullPath);
            return fullPath;
        }

        it('reads a single file into processEnv', () => {
            const path = writeEnv('basic.env', 'FOO=bar\nBAZ=qux');
            const target: Record<string, string> = {};
            loadDotenv({ path, processEnv: target, readFile: nodeReadFile });
            expect(target).to.deep.equal({ FOO: 'bar', BAZ: 'qux' });
        });

        it('respects first-wins precedence across multiple paths by default', () => {
            const first = writeEnv('first.env', 'WINNER=first\nONLY_FIRST=a');
            const second = writeEnv('second.env', 'WINNER=second\nONLY_SECOND=b');
            const target: Record<string, string> = {};
            loadDotenv({ path: [first, second], processEnv: target, readFile: nodeReadFile });
            expect(target.WINNER).to.equal('first');
            expect(target.ONLY_FIRST).to.equal('a');
            expect(target.ONLY_SECOND).to.equal('b');
        });

        it('lets later paths override earlier ones when override is true', () => {
            const first = writeEnv('over1.env', 'KEY=first');
            const second = writeEnv('over2.env', 'KEY=second');
            const target: Record<string, string> = {};
            loadDotenv({ path: [first, second], processEnv: target, override: true, readFile: nodeReadFile });
            expect(target.KEY).to.equal('second');
        });

        it('does not overwrite pre-existing processEnv values by default', () => {
            const path = writeEnv('preset.env', 'KEY=fromfile');
            const target: Record<string, string> = { KEY: 'frominit' };
            loadDotenv({ path, processEnv: target, readFile: nodeReadFile });
            expect(target.KEY).to.equal('frominit');
        });

        it('overwrites pre-existing processEnv values when override is true', () => {
            const path = writeEnv('preset-override.env', 'KEY=fromfile');
            const target: Record<string, string> = { KEY: 'frominit' };
            loadDotenv({ path, processEnv: target, override: true, readFile: nodeReadFile });
            expect(target.KEY).to.equal('fromfile');
        });

        it('silently skips missing files', () => {
            const real = writeEnv('real.env', 'FOO=bar');
            const ghost = join(tmpDir, 'does-not-exist.env');
            const target: Record<string, string> = {};
            expect(() =>
                loadDotenv({ path: [ghost, real], processEnv: target, readFile: nodeReadFile })
            ).to.not.throw();
            expect(target.FOO).to.equal('bar');
        });

        it('supports a custom encoding option', () => {
            const path = writeEnv('latin1.env', 'GREETING=hello');
            const target: Record<string, string> = {};
            loadDotenv({ path, processEnv: target, encoding: 'latin1', readFile: nodeReadFile });
            expect(target.GREETING).to.equal('hello');
        });

        afterEach(() => {
            // No-op cleanup hook to keep parity with other tests that may need state resets.
        });

        // Reference `written` so the watcher in CI doesn't flag it as unused.
        afterAll(() => {
            written.length = 0;
        });
    });
});
