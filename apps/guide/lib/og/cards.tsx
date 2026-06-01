import { ImageResponse } from 'next/og';

import { BrandLockup } from '@/components/BrandLockup';

import { tokenizeCode } from './highlight';
import { Code, CornerAccent, Dot, EditorFold, OgFrame } from './primitives';
import { loadOgFonts, OG, OG_SIZE } from './theme';

import type { OgSnippet } from './snippets';
import type { ReactElement } from 'react';

export function ogImage(node: ReactElement): ImageResponse {
    return new ImageResponse(node, { ...OG_SIZE, fonts: loadOgFonts() });
}

// The default / home card.
export function defaultCard(): ReactElement {
    return (
        <OgFrame>
            <CornerAccent size={92} />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '64px 72px' }}>
                <BrandLockup glyphSize={48} wordmarkHeight={42} gap={16} fill={OG.white} />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: 22 }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 23, color: OG.gold }}>
                        {'// the apt way to handle env'}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            fontSize: 74,
                            fontWeight: 600,
                            lineHeight: 1.04
                        }}
                    >
                        <div style={{ display: 'flex' }}>Typed config,</div>
                        <div style={{ display: 'flex' }}>
                            <span>straight from</span>
                            <span style={{ color: OG.brand, marginLeft: 14 }}>.env</span>
                        </div>
                    </div>
                    <div style={{ fontSize: 29, color: OG.muted, lineHeight: 1.42, maxWidth: 880 }}>
                        Read environment variables as real types. Zero runtime dependencies, plus zod/valibot/arktype
                        validation.
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontFamily: 'JetBrains Mono', fontSize: 27 }}>
                        <span style={{ color: OG.teal }}>$</span>
                        <span style={{ color: OG.white }}>npm i envapt</span>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div
                        style={{
                            height: 3,
                            borderRadius: 2,
                            backgroundImage: `linear-gradient(90deg, ${OG.brand}, rgba(222,110,57,0))`
                        }}
                    />
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontFamily: 'JetBrains Mono',
                            fontSize: 21
                        }}
                    >
                        <div style={{ display: 'flex', gap: 22, color: OG.muted }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span>Node</span>
                                <span style={{ color: OG.teal }}>20+</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span>Bun</span>
                                <span style={{ color: OG.teal }}>1.3+</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span>Deno</span>
                                <span style={{ color: OG.teal }}>2.5+</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ color: OG.teal }}>0</span>
                                <span>deps</span>
                            </div>
                        </div>
                        <div style={{ color: OG.url }}>envapt.materwelon.dev</div>
                    </div>
                </div>
            </div>
        </OgFrame>
    );
}

// Inset of the editor window from the card edges, leaving the grid visible around it.
const WINDOW_INSET = 64;
// The site's 28px chamfer scaled up; the OG window is ~2x the site's width.
const CHAMFER = 48;

const WINDOW_WIDTH = OG_SIZE.width - WINDOW_INSET * 2;
const WINDOW_HEIGHT = OG_SIZE.height - WINDOW_INSET * 2;

// Pure px, not percentages: Satori does not reliably support `calc(100% - 28px)` mixing % and px.
const WINDOW_CLIP = `polygon(0 0, ${WINDOW_WIDTH - CHAMFER}px 0, ${WINDOW_WIDTH}px ${CHAMFER}px, ${WINDOW_WIDTH}px ${WINDOW_HEIGHT}px, 0 ${WINDOW_HEIGHT}px)`;

// A doc-page card: an editor window showing the page's snippet.
export async function terminalCard(snippet: OgSnippet): Promise<ReactElement> {
    const tokens = await tokenizeCode(snippet.code, snippet.lang);
    return (
        <OgFrame>
            <div style={{ position: 'relative', display: 'flex', flex: 1 }}>
                <div
                    style={{
                        position: 'absolute',
                        top: WINDOW_INSET,
                        left: WINDOW_INSET,
                        width: WINDOW_WIDTH,
                        height: WINDOW_HEIGHT,
                        display: 'flex'
                    }}
                >
                    <div
                        style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            width: WINDOW_WIDTH,
                            height: WINDOW_HEIGHT,
                            backgroundColor: OG.panel,
                            clipPath: WINDOW_CLIP,
                            // inset ring for the 1px edge: Satori clips it to the chamfer, where a
                            // CSS `border` would draw a full square corner. Second value is the drop-shadow.
                            boxShadow: `inset 0 0 0 1px ${OG.windowBorder}, 0 22px 34px rgba(0,0,0,0.5)`
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '22px 28px',
                                borderBottom: `1px solid ${OG.chromeBorder}`
                            }}
                        >
                            <Dot color={OG.dotRed} />
                            <Dot color={OG.dotAmber} />
                            <Dot color={OG.dotTeal} />
                            <div style={{ marginLeft: 2, fontFamily: 'JetBrains Mono', fontSize: 21, color: OG.url }}>
                                {snippet.filename}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '34px 38px' }}>
                            <Code tokens={tokens} fontSize={25} />
                            <div
                                style={{
                                    marginTop: 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingTop: 24
                                }}
                            >
                                <BrandLockup glyphSize={33} wordmarkHeight={26} gap={12} fill={OG.white} />
                                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, color: OG.url }}>
                                    envapt.materwelon.dev
                                </div>
                            </div>
                        </div>
                    </div>
                    <EditorFold size={CHAMFER} />
                </div>
            </div>
        </OgFrame>
    );
}
