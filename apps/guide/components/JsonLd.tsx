import type { ReactNode } from 'react';

export function JsonLd({ data }: { data: Record<string, unknown> }): ReactNode {
    // a raw < in a value would let `</script>` close the tag early
    const json = JSON.stringify(data).replaceAll('<', '\\u003c');
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
