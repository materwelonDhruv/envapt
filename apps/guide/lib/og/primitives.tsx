import { OG, OG_SIZE } from './theme';

import type { CSSProperties, ReactNode } from 'react';
import type { ThemedToken } from 'shiki';

const GRID_CELL = 40;
const GRID_LINE = 2;

// The backdrop shared by every card. Grid drawn as an SVG <pattern>; Satori does not render CSS
// gradient grids.
export function OgFrame({ children }: { children: ReactNode }): ReactNode {
    return (
        <div
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                width: OG_SIZE.width,
                height: OG_SIZE.height,
                backgroundColor: OG.bg,
                color: OG.white,
                fontFamily: 'Hanken Grotesk'
            }}
        >
            <svg
                width={OG_SIZE.width}
                height={OG_SIZE.height}
                viewBox={`0 0 ${OG_SIZE.width} ${OG_SIZE.height}`}
                style={{ position: 'absolute', top: 0, left: 0 }}
            >
                <defs>
                    <pattern id="og-grid" width={GRID_CELL} height={GRID_CELL} patternUnits="userSpaceOnUse">
                        <path
                            d={`M ${GRID_CELL} 0 L 0 0 0 ${GRID_CELL}`}
                            fill="none"
                            stroke={OG.grid}
                            strokeWidth={GRID_LINE}
                        />
                    </pattern>
                </defs>
                <rect width={OG_SIZE.width} height={OG_SIZE.height} fill="url(#og-grid)" />
            </svg>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1 }}>{children}</div>
        </div>
    );
}

// The hero card's top-right accent: right angle at the corner, not a folded dog-ear like EditorFold.
export function CornerAccent({ size }: { size: number }): ReactNode {
    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: size,
                height: size,
                backgroundImage: `linear-gradient(135deg, ${OG.dotAmber}, ${OG.gold})`,
                clipPath: 'polygon(0 0, 100% 0, 100% 100%)'
            }}
        />
    );
}

// The doc window's folded dog-ear, sitting in the chamfer cut. Mirrors `.ev-editor-fold` on the site.
export function EditorFold({ size }: { size: number }): ReactNode {
    const clip = 'polygon(0 0, 100% 100%, 0 100%)';
    return (
        <>
            {/* Manual shadow triangle offset behind the flap; Satori has no CSS `filter` for a drop-shadow. */}
            <div
                style={{
                    position: 'absolute',
                    top: 3,
                    right: 3,
                    width: size,
                    height: size,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    clipPath: clip
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: size,
                    height: size,
                    backgroundImage: `linear-gradient(135deg, ${OG.dotAmber}, ${OG.gold})`,
                    clipPath: clip
                }}
            />
        </>
    );
}

export function Dot({ color }: { color: string }): ReactNode {
    return <div style={{ width: 17, height: 17, borderRadius: '50%', backgroundColor: color, marginRight: 12 }} />;
}

function tokenStyle(token: ThemedToken): CSSProperties {
    const fontStyle = token.fontStyle ?? 0;
    return {
        // Satori collapses whitespace without `pre`, dropping indentation and inter-token spaces.
        whiteSpace: 'pre',
        color: token.color,
        ...(fontStyle & 1 ? { fontStyle: 'italic' } : {}),
        ...(fontStyle & 2 ? { fontWeight: 700 } : {})
    };
}

// Renders Shiki tokens line by line. Empty lines hold a space to keep their height.
export function Code({ tokens, fontSize }: { tokens: ThemedToken[][]; fontSize: number }): ReactNode {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'JetBrains Mono',
                fontSize,
                lineHeight: 1.55
            }}
        >
            {tokens.map((line, lineIndex) => (
                <div
                    key={`line-${lineIndex}-${line.map((t) => t.content).join('')}`}
                    style={{ display: 'flex', whiteSpace: 'pre' }}
                >
                    {line.length === 0
                        ? ' '
                        : line.map((token, tokenIndex) => (
                              <span key={`tok-${lineIndex}-${tokenIndex}-${token.content}`} style={tokenStyle(token)}>
                                  {token.content}
                              </span>
                          ))}
                </div>
            ))}
        </div>
    );
}
