import type { Source } from '../types';

export function normalizeSource(source: Source | ((key: string) => string | undefined)): Source {
    return typeof source === 'function' ? { supportsFiles: false, readVars: () => ({}), readVar: source } : source;
}
