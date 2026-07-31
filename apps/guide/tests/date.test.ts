import { describe, expect, it } from 'vitest';

import { formatDate } from '../lib/date';

describe('formatDate', () => {
    it('renders the frontmatter day', () => {
        expect(formatDate('2026-07-31')).toBe('July 31, 2026');
    });

    it('holds the day across a month boundary', () => {
        expect(formatDate('2026-06-01')).toBe('June 1, 2026');
    });

    it('holds the day across a year boundary', () => {
        expect(formatDate('2026-01-01')).toBe('January 1, 2026');
    });
});
