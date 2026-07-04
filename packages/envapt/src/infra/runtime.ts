import type { Source } from '../types';

// importing Debug back into EnvapterBase would cycle, so the source and sink are injected via the setters below.
/* v8 ignore start -- @preserve replaced at load on Node so the Node suite never runs these defaults */
let sink: (line: string) => void = (line) => {
    // eslint-disable-next-line no-console -- the off-Node fallback log sink
    console.error(line);
};
let envReader: () => Record<string, string> = () => ({});
let varReader: ((key: string) => string | undefined) | undefined;
/* v8 ignore stop */

export function setRuntimeSink(fn: (line: string) => void): void {
    sink = fn;
}

export function writeRuntimeLine(line: string): void {
    sink(line);
}

// check snapshot first, then the source's per-key reader, so a reader source (empty snapshot) still resolves a key
export function readRuntimeVar(key: string): string | undefined {
    return envReader()[key] ?? varReader?.(key);
}

export function bindRuntimeFromSource(source: Source): void {
    envReader = (): Record<string, string> => source.readVars();
    const readVar = source.readVar;
    varReader = typeof readVar === 'function' ? readVar.bind(source) : undefined;
}
