import type { Source } from '../types';

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

// a reader source has an empty snapshot
export function readRuntimeVar(key: string): string | undefined {
    const fromSnapshot = envReader()[key];
    if (fromSnapshot !== undefined) return fromSnapshot;
    // ENVAPT_DEBUG reads go through here and must not throw during a config load
    try {
        return varReader?.(key);
    } catch {
        return undefined;
    }
}

export function bindRuntimeFromSource(source: Source): void {
    envReader = (): Record<string, string> => source.readVars();
    const readVar = source.readVar;
    varReader = typeof readVar === 'function' ? readVar.bind(source) : undefined;
}
