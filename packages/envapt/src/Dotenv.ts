import fs from 'node:fs';

/**
 * Public options for the internal `.env` loader. Mirrors the subset of dotenv's
 * `config()` options that envapt actually supports (no DOTENV_KEY, no quiet).
 * @public
 */
export interface DotenvConfigOptions {
    /** Encoding for reading .env files. Defaults to 'utf8'. */
    encoding?: BufferEncoding;
    /** When true, later files override earlier ones (and existing processEnv values). Default false (first-wins). */
    override?: boolean;
    /** When true, prints `[dotenv]` messages to stderr while parsing. Default false. */
    debug?: boolean;
}

/**
 * Internal call signature used by `EnvapterBase`. The `path` and `processEnv`
 * fields are managed by envapt and never user-supplied.
 * @internal
 */
export interface LoadDotenvInput extends DotenvConfigOptions {
    /** One or more `.env` paths to load, in declaration order. */
    path: string | string[];
    /** Target env map. Mutated in place with parsed values. */
    processEnv: Record<string, string>;
}

// Matches: optional `export`, KEY name, optional whitespace, `=`, optional whitespace, value tail.
// Multi-line quoted values are handled by re-buffering subsequent lines below.
// Bounded by anchors with linear-time quantifiers; no catastrophic backtracking risk -- justified
// eslint-disable-next-line security/detect-unsafe-regex
const KEY_LINE_RE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/u;

/**
 * Parse a `.env` text blob into a `Map<string, string>`.
 *
 * Supported syntax:
 * - `KEY=value` and `export KEY=value`
 * - blank lines and full-line `# comments`
 * - single-quoted `'literal'` values (no escape interpretation)
 * - double-quoted `"value"` values (interprets `\n`, `\r`, `\t`, `\\`, `\"`)
 * - backtick-quoted values (literal, like single quotes)
 * - quoted values may span multiple lines
 * - inline `# comment` after an unquoted value (requires whitespace before `#`)
 * - empty values resolve to `""`
 *
 * Mirrors dotenv's quirk where unescaped inner quotes inside a quoted value
 * are tolerated by greedy-matching to the rightmost matching quote on the
 * (possibly multi-line) value buffer. This is what lets a value like
 * `JSON="{"name":"x"}"` round-trip without escaping.
 *
 * Does NOT perform `${VAR}` expansion — envapt's `Parser` handles that downstream.
 * @internal
 */
export function parseDotenv(src: string): Map<string, string> {
    const out = new Map<string, string>();
    const lines = src.split(/\r?\n/u);

    for (let i = 0; i < lines.length; i++) {
        const consumed = parseEntry(lines, i);
        i = consumed.endLine;
        if (consumed.entry) out.set(consumed.entry.key, consumed.entry.value);
    }

    return out;
}

interface ParsedEntry {
    key: string;
    value: string;
}

function parseEntry(lines: string[], start: number): { entry: ParsedEntry | undefined; endLine: number } {
    /* v8 ignore next -- @preserve caller bounds-checks start so this never falls back */
    const line = lines[start] ?? '';
    const trimmedLine = line.trim();
    if (trimmedLine === '' || trimmedLine.startsWith('#')) return { entry: undefined, endLine: start };

    const match = line.match(KEY_LINE_RE);
    if (!match) return { entry: undefined, endLine: start };

    const key = match[1] as string;
    // Drop only leading whitespace before the value; trailing whitespace and inline comments
    // are dealt with below depending on whether the value is quoted.
    /* v8 ignore next -- @preserve regex group 2 always matches via `(.*)`, fallback is defensive */
    const rest = (match[2] ?? '').replace(/^\s+/u, '');
    const firstChar = rest[0];

    if (firstChar === '"' || firstChar === "'" || firstChar === '`') {
        const consumed = consumeQuotedValue(rest, lines, start, firstChar);
        return { entry: { key, value: consumed.value }, endLine: consumed.endLine };
    }

    return { entry: { key, value: stripInlineComment(rest) }, endLine: start };
}

function consumeQuotedValue(
    firstLineRest: string,
    lines: string[],
    startLine: number,
    quote: string
): { value: string; endLine: number } {
    let buffer = firstLineRest;
    let cursor = startLine;
    let closeIdx = findLastUnescapedQuote(buffer, quote);

    while (closeIdx < 0 && cursor < lines.length - 1) {
        cursor++;
        /* v8 ignore next -- @preserve cursor is bounded by the while condition above */
        buffer += `\n${lines[cursor] ?? ''}`;
        closeIdx = findLastUnescapedQuote(buffer, quote);
    }

    const inner = closeIdx > 0 ? buffer.slice(1, closeIdx) : buffer.slice(1);
    return { value: quote === '"' ? unescapeDouble(inner) : inner, endLine: cursor };
}

function stripInlineComment(value: string): string {
    const hashIdx = findInlineCommentStart(value);
    const stripped = hashIdx === -1 ? value : value.slice(0, hashIdx);
    return stripped.trimEnd();
}

function findInlineCommentStart(value: string): number {
    for (let i = 0; i < value.length; i++) {
        if (value[i] === '#' && (i === 0 || /\s/u.test(value[i - 1] as string))) return i;
    }
    return -1;
}

/**
 * Find the rightmost matching closing quote in `buffer` (skipping index 0 which is the
 * opening quote). For `"`, a quote preceded by an odd number of backslashes is escaped
 * and ignored. Single and backtick quotes do not unescape.
 */
function findLastUnescapedQuote(buffer: string, quote: string): number {
    for (let i = buffer.length - 1; i > 0; i--) {
        if (buffer[i] !== quote) continue;
        if (quote === '"') {
            let backslashes = 0;
            let k = i - 1;
            while (k >= 0 && buffer[k] === '\\') {
                backslashes++;
                k--;
            }
            if (backslashes % 2 === 1) continue; // escaped
        }
        return i;
    }
    return -1;
}

function unescapeDouble(raw: string): string {
    let out = '';
    for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        if (ch !== '\\' || i === raw.length - 1) {
            out += ch;
            continue;
        }
        const next = raw[i + 1];
        i++;
        switch (next) {
            case 'n':
                out += '\n';
                break;
            case 'r':
                out += '\r';
                break;
            case 't':
                out += '\t';
                break;
            case '\\':
                out += '\\';
                break;
            case '"':
                out += '"';
                break;
            default:
                /* v8 ignore next -- @preserve `next` is always defined when this branch is reached (guarded above) */
                out += `\\${next ?? ''}`;
        }
    }
    return out;
}

/**
 * Load one or more `.env` files into a target `processEnv` map. Mirrors the
 * subset of dotenv's `config()` semantics that envapt depends on: first-wins
 * across multiple paths by default, optional `override: true`, optional
 * non-UTF8 encoding, missing files are skipped silently.
 * @internal
 */
export function loadDotenv(input: LoadDotenvInput): void {
    const paths = Array.isArray(input.path) ? input.path : [input.path];
    const encoding: BufferEncoding = input.encoding ?? 'utf8';
    const override = input.override ?? false;

    for (const filePath of paths) {
        let src: string;
        try {
            src = fs.readFileSync(filePath, encoding);
        } catch {
            // Debug logging intentionally goes to stderr to mirror dotenv's behavior -- justified
            // eslint-disable-next-line no-console
            if (input.debug) console.error(`[dotenv] could not read ${filePath}`);
            continue;
        }

        const parsed = parseDotenv(src);
        for (const [key, value] of parsed) {
            const exists = Object.prototype.hasOwnProperty.call(input.processEnv, key);
            if (!exists || override) input.processEnv[key] = value;
            // Debug logging intentionally goes to stderr to mirror dotenv's behavior -- justified
            // eslint-disable-next-line no-console
            if (input.debug) console.error(`[dotenv] ${filePath} -> ${key}`);
        }
    }
}
