import { codeToHtml } from 'shiki';

import { cn } from '@/lib/cn';

import type { ReactNode } from 'react';

interface CodeProps {
    code: string;
    lang?: string;
    dense?: boolean;
}

// ayu themes match the docs MDX blocks; dual-theme output (defaultColor: false) is colored by `.ev-snippet` in global.css.
export async function Code({ code, lang = 'ts', dense = false }: CodeProps): Promise<ReactNode> {
    const html = await codeToHtml(code, {
        lang,
        themes: { light: 'ayu-light', dark: 'ayu-dark' },
        defaultColor: false
    });

    return <div className={cn('ev-snippet', dense && 'ev-snippet-dense')} dangerouslySetInnerHTML={{ __html: html }} />;
}
