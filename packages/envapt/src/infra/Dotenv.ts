import { debugVerbose, debugWarn } from './Debug';

/**
 * Options for the `.env` loader, matching the dotenv `config()` options of the same name.
 * For debug output, use `Envapter.debug` (or the `ENVAPT_DEBUG` env var).
 *
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/configuration#which-files-load}
 */
export interface EnvFileOptions {
    /** Encoding for reading .env files. Defaults to 'utf8'. */
    encoding?: string;
    /** When true, later files override earlier ones (and existing processEnv values). Default false (first-wins). */
    override?: boolean;
}

export interface LoadDotenvInput extends EnvFileOptions {
    path: string | string[];
    processEnv: Record<string, string>;
    // passed in because this file must not import node:fs
    readFile(path: string, encoding: string): string | undefined;
}

// the anchors and linear quantifiers rule out catastrophic backtracking
// eslint-disable-next-line security/detect-unsafe-regex
const KEY_LINE_RE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/u;

// does not expand `${VAR}`, TemplateResolver does that on read
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
    /* v8 ignore next -- @preserve regex group 2 always matches via `(.*)` */
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

// closes on the last quote, like dotenv. JSON="{"name":"x"}" parses without escaping.
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

export function loadDotenv(input: LoadDotenvInput): Set<string> {
    const paths = Array.isArray(input.path) ? input.path : [input.path];
    const encoding = input.encoding ?? 'utf8';
    const override = input.override ?? false;
    const written = new Set<string>();

    for (const filePath of paths) {
        const src = input.readFile(filePath, encoding);
        if (src === undefined) {
            debugWarn(`could not read ${filePath}`);
            continue;
        }

        const parsed = parseDotenv(src);
        debugVerbose(`loaded ${filePath}: ${parsed.size} ${parsed.size === 1 ? 'key' : 'keys'}`);
        for (const [key, value] of parsed) {
            const exists = Object.prototype.hasOwnProperty.call(input.processEnv, key);
            if (!exists || override) {
                input.processEnv[key] = value;
                written.add(key);
                debugVerbose(`${filePath} -> ${key}`);
            }
        }
    }

    return written;
}
