import * as Twoslash from 'fumadocs-twoslash/ui';
import defaultComponents from 'fumadocs-ui/mdx';

import { Callout } from '@/components/Callout';

import type { MDXComponents } from 'mdx/types';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
    return {
        ...defaultComponents,
        ...Twoslash,
        Callout,
        ...components
    };
}
