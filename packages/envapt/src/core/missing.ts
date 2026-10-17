import { state } from './state';

import type { EnvKeyInput } from '../types';

// every missing-value check goes through this
export function isMissing(value: string | undefined): boolean {
    if (value === undefined || value === '') return true;
    if (state.strict && value.trim() === '') return true;
    return false;
}

export function hasFallback(fallback: unknown): boolean {
    return fallback !== undefined;
}

export function formatKeyForError(key: EnvKeyInput): string {
    return Array.isArray(key) ? `[${key.join(', ')}]` : String(key);
}
