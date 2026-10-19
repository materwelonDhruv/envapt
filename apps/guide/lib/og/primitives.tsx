import { OG, OG_SIZE } from './theme';

import type { CSSProperties, ReactNode } from 'react';
import type { ThemedToken } from 'shiki';

const GRID_CELL = 40;
const GRID_LINE = 1;

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
                backgroundImage: `linear-gradient(${OG.grid} ${GRID_LINE}px, transparent ${GRID_LINE}px), linear-gradient(90deg, ${OG.grid} ${GRID_LINE}px, transparent ${GRID_LINE}px)`,
                backgroundSize: `${GRID_CELL}px ${GRID_CELL}px`,
                color: OG.white,
                fontFamily: 'Hanken Grotesk'
            }}
        >
            {children}
        </div>
    );
}

// a top-right triangle, with its right angle in the corner
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

// mirrors .ev-editor-fold in app/global.css
export function EditorFold({ size }: { size: number }): ReactNode {
    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: size,
                height: size,
                backgroundImage: `linear-gradient(135deg, ${OG.dotAmber}, ${OG.gold})`,
                clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
                filter: 'drop-shadow(-2px 2px 2px rgba(0,0,0,0.28))'
            }}
        />
    );
}

export function Dot({ color }: { color: string }): ReactNode {
    return <div style={{ width: 17, height: 17, borderRadius: '50%', backgroundColor: color, marginRight: 12 }} />;
}

// shiki's FontStyle bit flags
const ITALIC = 1;
const BOLD = 2;

function tokenStyle(token: ThemedToken): CSSProperties {
    const fontStyle = token.fontStyle ?? 0;
    return {
        color: token.color,
        ...(fontStyle & ITALIC ? { fontStyle: 'italic' } : {}),
        ...(fontStyle & BOLD ? { fontWeight: 700 } : {})
    };
}

// a no-break space keeps an empty line's height
const EMPTY_LINE = ' ';

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
                        ? EMPTY_LINE
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
