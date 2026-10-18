import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { JsonLd } from '../components/JsonLd';

describe('JsonLd', () => {
    it('keeps a closing script tag inside a value from ending the script', () => {
        const html = renderToStaticMarkup(<JsonLd data={{ headline: 'a </script><b>x</b>' }} />);

        expect(html.match(/<\/script>/g)).toHaveLength(1);
        expect(JSON.parse(html.replace(/^<script[^>]*>|<\/script>$/g, ''))).toEqual({
            headline: 'a </script><b>x</b>'
        });
    });
});
