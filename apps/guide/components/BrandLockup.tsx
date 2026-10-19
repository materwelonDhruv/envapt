import { Glyph } from './Glyph';
import { Wordmark } from './Wordmark';

import type { CSSProperties, ReactNode } from 'react';

// Must match the viewBox of the brand artwork (Glyph.tsx, Wordmark.tsx); widths derive from these.
const GLYPH_VIEWBOX_WIDTH = 100;
const GLYPH_VIEWBOX_HEIGHT = 110;
const WORDMARK_VIEWBOX_WIDTH = 627;
const WORDMARK_VIEWBOX_HEIGHT = 212;
const GLYPH_RATIO = GLYPH_VIEWBOX_WIDTH / GLYPH_VIEWBOX_HEIGHT;
const WORDMARK_RATIO = WORDMARK_VIEWBOX_WIDTH / WORDMARK_VIEWBOX_HEIGHT;

interface BrandLockupProps {
    /** Height of the glyph mark, in px. */
    glyphSize: number;
    /** Height of the wordmark, in px. Each placement tunes it by eye. */
    wordmarkHeight: number;
    /** Space between the glyph and the wordmark, in px. */
    gap?: number;
    /** Wordmark fill. Defaults to `currentColor`, so it follows the surrounding text color. */
    fill?: string;
    style?: CSSProperties;
}

// inline styles only. the OG cards render this without app/global.css
export function BrandLockup({
    glyphSize,
    wordmarkHeight,
    gap = 8,
    fill = 'currentColor',
    style
}: BrandLockupProps): ReactNode {
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap, ...style }}>
            <Glyph width={glyphSize * GLYPH_RATIO} height={glyphSize} />
            <Wordmark
                width={wordmarkHeight * WORDMARK_RATIO}
                height={wordmarkHeight}
                fill={fill}
                // 1px lower reads as centered beside the glyph
                style={{ transform: 'translateY(1px)' }}
            />
        </span>
    );
}
