import path from 'node:path';

import createConfig from '@seedcord/eslint-config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import * as mdx from 'eslint-plugin-mdx';
import reactCompiler from 'eslint-plugin-react-compiler';

export default createConfig({
    tsconfigRootDir: import.meta.dirname,
    // nextVitals registers `import` and the `@typescript-eslint` parser itself
    registerImportPlugin: 'off',
    registerTypescriptConfigs: false,
    registerUnicornPlugin: false,
    tailwindEntryPoint: path.resolve(import.meta.dirname, 'app/global.css'),
    tailwindCalleeFunctions: ['cn', 'clsx', 'twMerge'],
    userConfigs: [
        // registers react, react-hooks, import, jsx-a11y, and @next
        ...nextVitals,

        reactCompiler.configs.recommended,

        // jsx-a11y is not registered for *.mdx
        {
            files: ['**/*.{ts,tsx}'],
            rules: {
                ...jsxA11y.flatConfigs.strict.rules,
                'jsx-a11y/alt-text': ['error', { elements: ['img'], img: ['Image'] }],
                'react/jsx-no-target-blank': 'error',
                'react-hooks/exhaustive-deps': 'error',
                'import/no-anonymous-default-export': 'error'
            }
        },

        // twoslash samples carry `---cut---`, `^?`, and `@errors` markers that plain TS rejects
        {
            ...mdx.flat,
            files: ['**/*.mdx'],
            settings: { 'mdx/code-blocks': false }
        },

        { ignores: ['.next/**', 'out/**', 'build/**', '.source/**', 'next-env.d.ts'] }
    ]
});
