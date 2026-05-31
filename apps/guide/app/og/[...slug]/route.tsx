import { defaultCard, ogImage } from '@/lib/og/cards';

import type { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

// The dynamic segment makes static export emit a real `.png` file; a plain `app/og/route.tsx`
// emits an extension-less file served as the wrong content-type. The slug value is otherwise unused.
export function generateStaticParams(): { slug: string[] }[] {
    return [{ slug: ['image.png'] }];
}

export function GET(): ImageResponse {
    return ogImage(defaultCard());
}
