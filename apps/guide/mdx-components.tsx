import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import * as Twoslash from 'fumadocs-twoslash/ui';
import defaultComponents from 'fumadocs-ui/mdx';

import { Callout } from '@/components/Callout';
import { CodeTypeTable } from '@/components/CodeTypeTable';

import type { MDXComponents } from 'mdx/types';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
    return {
        ...defaultComponents,
        ...Twoslash,
        Callout,
        Tab,
        Tabs,
        Step,
        Steps,
        Accordion,
        Accordions,
        File,
        Files,
        Folder,
        TypeTable: CodeTypeTable,
        ...components
    };
}
