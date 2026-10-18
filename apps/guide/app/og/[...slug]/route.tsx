import { defaultCard, ogImage } from '@/lib/og/cards';
import { OG_FILE } from '@/lib/og/images';

import type { ImageResponse } from 'takumi-js/response';

export const dynamic = 'force-static';

export function generateStaticParams(): { slug: string[] }[] {
    return [{ slug: [OG_FILE] }];
}

export function GET(): ImageResponse {
    return ogImage(defaultCard());
}
