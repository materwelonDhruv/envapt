import createConfig from '@seedcord/eslint-config';

export default createConfig({
    tsconfigRootDir: import.meta.dirname,
    userConfigs: [
        {
            files: ['tests/**/*.test.ts'],
            rules: {
                '@typescript-eslint/no-unused-expressions': 'off',
                'max-nested-callbacks': ['warn', 10],
                'max-lines': ['warn', { max: 600 }],

                // decorator fixtures are static-only classes by design
                '@typescript-eslint/no-extraneous-class': 'off'
            }
        },
        {
            // intentionally-broken fixtures the compiler-API test reads, and tsc-emit build output
            ignores: ['tests/type-error-fixtures/**', 'tests/tsc-emit/out/**']
        },
        {
            // integration suites import the built dist/ off the node_modules resolver, so the linter
            // cannot resolve those types and the decorator fixtures are static-only by design. Deno
            // also requires explicit `.mjs` on relative imports, and the assertion literals are intentional.
            files: ['tests/integration/**/*.mjs', 'tests/integration/**/*.ts'],
            rules: {
                'import/no-useless-path-segments': 'off',
                'import/no-unresolved': 'off',
                'no-magic-numbers': 'off',
                '@typescript-eslint/no-extraneous-class': 'off',
                '@typescript-eslint/no-unsafe-call': 'off',
                '@typescript-eslint/no-unsafe-member-access': 'off'
            }
        },
        {
            // Workers tests run on workerd via their own tsconfig (built dist + cloudflare:workers
            // virtual module), neither of which the default project resolves.
            files: ['tests/workers/**/*.ts'],
            languageOptions: {
                parserOptions: {
                    project: ['./tests/workers/tsconfig.json'],
                    tsconfigRootDir: import.meta.dirname
                }
            },
            rules: {
                'import/no-unresolved': 'off',
                'import/no-useless-path-segments': 'off'
            }
        },
        {
            // Browser tests run in chromium via their own tsconfig (built dist + DOM + import.meta.env),
            // none of which the default project resolves.
            files: ['tests/browser/**/*.ts'],
            languageOptions: {
                parserOptions: {
                    project: ['./tests/browser/tsconfig.json'],
                    tsconfigRootDir: import.meta.dirname
                }
            },
            rules: {
                'import/no-unresolved': 'off',
                'import/no-useless-path-segments': 'off'
            }
        }
    ]
});
