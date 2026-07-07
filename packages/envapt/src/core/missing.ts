import { state } from './state';

// the one missing-check, use it everywhere so behavior stays consistent
export function isMissing(value: string | undefined): boolean {
    if (value === undefined || value === '') return true;
    if (state.strict && value.trim() === '') return true;
    return false;
}

// an explicit undefined fallback counts as no fallback, use it everywhere so behavior stays consistent
export function hasFallback(fallback: unknown): boolean {
    return fallback !== undefined;
}
