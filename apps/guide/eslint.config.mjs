import path from 'node:path';

import createConfig from '@seedcord/eslint-config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactCompiler from 'eslint-plugin-react-compiler';
import tailwindCanonical from 'eslint-plugin-tailwind-canonical-classes';

const TAILWIND_ENTRY = path.resolve(import.meta.dirname, 'app/global.css');
const TAILWIND_CALLEES = ['cn', 'clsx', 'twMerge'];
const TAILWIND_TAGS = ['tw'];

export default createConfig({
    tsconfigRootDir: import.meta.dirname,
    // nextVitals registers `import` + the `@typescript-eslint` parser block itself; let it own them.
    registerImportPlugin: false,
    registerTypescriptConfigs: false,
    userConfigs: [
        // Brings the react, react-hooks, import, jsx-a11y, and @next plugins; later blocks lift rules off these rather than re-registering.
        ...nextVitals,

        reactCompiler.configs.recommended,

        // nextVitals already declares the jsx-a11y plugin; only lift its strict rule set + hardening.
        {
            rules: {
                ...jsxA11y.flatConfigs.strict.rules,
                'jsx-a11y/alt-text': ['error', { elements: ['img'], img: ['Image'] }],
                'react/jsx-no-target-blank': 'error',
                'react-hooks/exhaustive-deps': 'error',
                'import/no-anonymous-default-export': 'error'
            }
        },

        // Tailwind canonical-class lint (autofix on --fix), ported from seedcord's eslint-config:
        // the published @seedcord/eslint-config@1.3.3 predates its tailwind block, so `tailwindEntryPoint`
        // is a no-op there. better-tailwindcss collapses shorthands (h-N w-N -> size-N); canonical-classes
        // normalizes arbitrary values to the scale + fixes v4 modifier positions.
        {
            files: ['**/*.{ts,tsx}'],
            plugins: {
                'better-tailwindcss': betterTailwindcss,
                'tailwind-canonical-classes': tailwindCanonical
            },
            settings: { 'better-tailwindcss': { entryPoint: TAILWIND_ENTRY } },
            rules: {
                'better-tailwindcss/enforce-canonical-classes': [
                    'warn',
                    { callees: TAILWIND_CALLEES, tags: TAILWIND_TAGS }
                ],
                'tailwind-canonical-classes/tailwind-canonical-classes': [
                    'warn',
                    { cssPath: TAILWIND_ENTRY, calleeFunctions: TAILWIND_CALLEES }
                ]
            }
        },

        { ignores: ['.next/**', 'out/**', 'build/**', '.source/**', 'next-env.d.ts'] }
    ]
});
