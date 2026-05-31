import { codeToTokens } from 'shiki';

import type { BundledLanguage, ThemedToken } from 'shiki';

// Uses ayu-dark to match the docs code blocks (see components/Code.tsx).
export async function tokenizeCode(code: string, lang: BundledLanguage): Promise<ThemedToken[][]> {
    const { tokens } = await codeToTokens(code, { lang, theme: 'ayu-dark' });
    return tokens;
}
