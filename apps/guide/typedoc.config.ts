import type { TypeDocOptions } from 'typedoc';
import type { PluginOptions } from 'typedoc-plugin-markdown';

const TYPES = 'node_modules/envapt/dist/types';

const config: Partial<TypeDocOptions & PluginOptions> = {
    plugin: ['typedoc-plugin-markdown', 'typedoc-plugin-frontmatter', './lib/typedoc-fumadocs.ts'],
    theme: 'fumadocs',
    entryPoints: [`${TYPES}/index.d.mts`, `${TYPES}/legacy.d.mts`],
    tsconfig: 'tsconfig.typedoc.json',
    out: 'content/docs/api/reference',
    fileExtension: '.mdx',
    entryFileName: 'index',
    readme: 'none',
    sanitizeComments: true,
    hidePageHeader: true,
    hideBreadcrumbs: true,
    hidePageTitle: true,
    disableSources: true,
    parametersFormat: 'table',
    interfacePropertiesFormat: 'table',
    classPropertiesFormat: 'table',
    typeDeclarationFormat: 'table',
    useCodeBlocks: true
};

export default config;
