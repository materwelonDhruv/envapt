import createConfig from '@seedcord/eslint-config';

export default createConfig({
    tsconfigRootDir: import.meta.dirname,
    registerUnicornPlugin: false,
    userConfigs: [
        {
            files: ['src/core/AdvancedMethods.ts'],
            rules: { 'no-restricted-syntax': 'off' }
        },
        {
            files: ['src/infra/runtime.ts'],
            rules: { '@typescript-eslint/unbound-method': 'off' }
        },
        {
            files: ['tests/**/*.test.ts'],
            rules: {
                '@typescript-eslint/no-unused-expressions': 'off',
                'max-nested-callbacks': ['warn', 10],
                'max-lines': ['warn', { max: 600 }],

                // decorator fixtures are static-only classes
                '@typescript-eslint/no-extraneous-class': 'off'
            }
        },
        {
            // type-error-fixtures fail to compile on purpose
            ignores: [
                'tests/type-error-fixtures/**',
                'tests/tsc-emit/out*/**',
                'tests/stage3-emit/out*/**',
                'tests/integration/modern-decorator-check.ts'
            ]
        },
        {
            files: ['tests/integration/**/*.mjs', 'tests/integration/**/*.ts'],
            rules: {
                // deno needs the explicit `.mjs` on relative imports
                'import-x/no-useless-path-segments': 'off',
                // the linter cannot resolve the built dist these import
                'import-x/no-unresolved': 'off',
                '@typescript-eslint/no-unsafe-call': 'off',
                '@typescript-eslint/no-unsafe-member-access': 'off',
                'no-magic-numbers': 'off',
                '@typescript-eslint/no-extraneous-class': 'off'
            }
        },
        {
            // the default tsconfig does not resolve the built dist or `cloudflare:workers`
            files: ['tests/workers/**/*.ts'],
            languageOptions: {
                parserOptions: {
                    project: ['./tests/workers/tsconfig.json'],
                    tsconfigRootDir: import.meta.dirname
                }
            },
            rules: {
                'import-x/no-unresolved': 'off',
                'import-x/no-useless-path-segments': 'off'
            }
        },
        {
            // chromium tests need DOM types and `import.meta.env`
            files: ['tests/browser/**/*.ts'],
            languageOptions: {
                parserOptions: {
                    project: ['./tests/browser/tsconfig.json'],
                    tsconfigRootDir: import.meta.dirname
                }
            },
            rules: {
                'import-x/no-unresolved': 'off',
                'import-x/no-useless-path-segments': 'off'
            }
        }
    ]
});
