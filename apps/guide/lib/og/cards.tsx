import { ImageResponse } from 'takumi-js/response';

import { BrandLockup } from '@/components/BrandLockup';

import { tokenizeCode } from './highlight';
import { Code, CornerAccent, Dot, EditorFold, OgFrame } from './primitives';
import { loadOgFonts, OG, OG_SIZE } from './theme';

import type { OgSnippet } from './snippets';
import type { ReactElement } from 'react';

export function ogImage(node: ReactElement): ImageResponse {
    return new ImageResponse(node, { ...OG_SIZE, fonts: loadOgFonts() });
}

const RUNTIMES: { label: string; version?: string }[] = [
    { label: 'Node', version: '22+' },
    { label: 'Bun', version: '1.3+' },
    { label: 'Deno', version: '2.5+' },
    { label: 'Workers' },
    { label: 'Browser' }
];

export function defaultCard(): ReactElement {
    return (
        <OgFrame>
            <CornerAccent size={92} />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '50px 72px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                    <BrandLockup glyphSize={50} wordmarkHeight={44} gap={16} fill={OG.white} />
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 24, color: OG.gold }}>
                        {'// the apt way to read config'}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: 30 }}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            fontSize: 78,
                            fontWeight: 600,
                            lineHeight: 1.04
                        }}
                    >
                        <div style={{ display: 'flex' }}>Typed config,</div>
                        <div style={{ display: 'flex' }}>
                            <span>from</span>
                            <span style={{ color: OG.brand, marginLeft: 14 }}>any source</span>
                        </div>
                    </div>
                    <div style={{ fontSize: 30, color: OG.muted, lineHeight: 1.45, maxWidth: 920 }}>
                        Read config as real types from process.env, a Workers binding, a browser bundle, or any object
                        you bind. It has no runtime dependencies, and it accepts zod, valibot, and arktype schemas.
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 12, fontFamily: 'JetBrains Mono', fontSize: 28 }}>
                        <span style={{ color: OG.teal }}>$</span>
                        <span style={{ color: OG.white }}>pnpm add envapt</span>
                    </div>
                    <div
                        style={{
                            height: 3,
                            borderRadius: 2,
                            marginTop: 20,
                            marginBottom: 14,
                            backgroundImage: `linear-gradient(90deg, ${OG.brand}, rgba(222,110,57,0))`
                        }}
                    />
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontFamily: 'JetBrains Mono',
                            fontSize: 22
                        }}
                    >
                        <div style={{ display: 'flex', gap: 22, color: OG.muted }}>
                            {RUNTIMES.map((r) => (
                                <div key={r.label} style={{ display: 'flex', gap: 6 }}>
                                    <span>{r.label}</span>
                                    {r.version ? <span style={{ color: OG.teal }}>{r.version}</span> : null}
                                </div>
                            ))}
                        </div>
                        <div style={{ color: OG.url }}>envapt.materwelon.dev</div>
                    </div>
                </div>
            </div>
        </OgFrame>
    );
}

export function blogCard({ title, byline }: { title: string; byline: string }): ReactElement {
    return (
        <OgFrame>
            <CornerAccent size={92} />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '50px 72px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                    <BrandLockup glyphSize={50} wordmarkHeight={44} gap={16} fill={OG.white} />
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 24, color: OG.gold }}>{'// blog'}</div>
                </div>
                <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
                    <div style={{ fontSize: 72, fontWeight: 600, lineHeight: 1.08, maxWidth: 1000 }}>{title}</div>
                </div>
                <div
                    style={{
                        height: 3,
                        borderRadius: 2,
                        marginBottom: 14,
                        backgroundImage: `linear-gradient(90deg, ${OG.gold}, rgba(248,182,50,0))`
                    }}
                />
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontFamily: 'JetBrains Mono',
                        fontSize: 22
                    }}
                >
                    <div style={{ color: OG.muted }}>{byline}</div>
                    <div style={{ color: OG.url }}>envapt.materwelon.dev</div>
                </div>
            </div>
        </OgFrame>
    );
}

const WINDOW_INSET = 64;
// scaled up from the site's 28px chamfer
const CHAMFER = 48;

export async function editorCard(snippet: OgSnippet): Promise<ReactElement> {
    const tokens = await tokenizeCode(snippet.code, snippet.lang);
    return (
        <OgFrame>
            <div
                style={{
                    position: 'absolute',
                    inset: WINDOW_INSET,
                    display: 'flex',
                    // on the wrapper so the shadow follows the clipped window
                    filter: 'drop-shadow(0 22px 34px rgba(0,0,0,0.5))'
                }}
            >
                <div
                    style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        backgroundColor: OG.panel,
                        clipPath: `polygon(0 0, calc(100% - ${CHAMFER}px) 0, 100% ${CHAMFER}px, 100% 100%, 0 100%)`,
                        boxShadow: `inset 0 0 0 1px ${OG.windowBorder}`
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
        </OgFrame>
    );
}
