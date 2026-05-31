import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Mirrors the dark-theme tokens in app/global.css. Duplicated as literals because Satori cannot
// read CSS variables.
export const OG = {
    bg: '#13171a',
    panel: '#0d1116',
    brand: '#de6e39',
    gold: '#f8b632',
    teal: '#5fd1c4',
    dotRed: '#e35d28',
    dotAmber: '#f7cc88',
    dotTeal: '#5fd1c4',
    white: '#f3f1ec',
    muted: '#98a2aa',
    url: '#7e8893',
    // Grid stroke color (see OgFrame). Alpha is tuned for social-preview scale; lower it for a fainter grid.
    grid: 'rgba(255,255,255,0.09)',
    windowBorder: '#232a31',
    chromeBorder: '#1b222a'
} as const;

export const OG_SIZE = { width: 1200, height: 630 } as const;

const REGULAR_WEIGHT = 400;
const SEMIBOLD_WEIGHT = 600;

interface OgFont {
    name: string;
    data: Buffer;
    weight: typeof REGULAR_WEIGHT | typeof SEMIBOLD_WEIGHT;
    style: 'normal';
}

const FONT_DIR = join(process.cwd(), 'lib/og/fonts');

let cachedFonts: OgFont[] | undefined;

// Satori needs font buffers, read from disk. Reads relative to the working directory (the guide
// package root) because `fetch(new URL(..., import.meta.url))` is unsupported under the Turbopack
// static-export build.
export function loadOgFonts(): OgFont[] {
    cachedFonts ??= [
        {
            name: 'Hanken Grotesk',
            data: readFileSync(join(FONT_DIR, 'HankenGrotesk-Regular.ttf')),
            weight: REGULAR_WEIGHT,
            style: 'normal'
        },
        {
            name: 'Hanken Grotesk',
            data: readFileSync(join(FONT_DIR, 'HankenGrotesk-SemiBold.ttf')),
            weight: SEMIBOLD_WEIGHT,
            style: 'normal'
        },
        {
            name: 'JetBrains Mono',
            data: readFileSync(join(FONT_DIR, 'JetBrainsMono-Regular.ttf')),
            weight: REGULAR_WEIGHT,
            style: 'normal'
        }
    ];
    return cachedFonts;
}
