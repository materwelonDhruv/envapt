import { state } from './state';

// this should be used to determine if a value is missing EVERYWHERE so the behavior is consistent
export function isMissing(value: string | undefined): boolean {
    if (value === undefined || value === '') return true;
    if (state.strict && value.trim() === '') return true;
    return false;
}
