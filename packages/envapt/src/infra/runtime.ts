import type { EnvSource } from '../types';

// EnvapterBase imports Debug; importing it back would cycle, so the source/sink are injected via the setters below.
/* v8 ignore start -- @preserve replaced at load on Node; the Node suite never runs these defaults */
let sink: (line: string) => void = (line) => {
    // eslint-disable-next-line no-console -- the off-Node fallback log sink
    console.error(line);
};
let envReader: () => Record<string, string> = () => ({});
/* v8 ignore stop */

export function setRuntimeSink(fn: (line: string) => void): void {
    sink = fn;
}

export function writeRuntimeLine(line: string): void {
    sink(line);
}

export function readRuntimeEnv(): Record<string, string> {
    return envReader();
}

export function bindRuntimeFromSource(source: EnvSource): void {
    envReader = (): Record<string, string> => source.readVars();
}
