import createConfig from '@seedcord/eslint-config';

export default createConfig({
    tsconfigRootDir: import.meta.dirname,
    userConfigs: [
        {
            // Test files
            files: ['tests/**/*.test.ts'],
            rules: {
                '@typescript-eslint/no-unused-expressions': 'off',
                'max-nested-callbacks': ['warn', 10],
                'max-lines': ['warn', { max: 600 }]
            }
        },
        {
            // Type-error fixtures: intentionally broken code consumed by the compiler-API
            // test at runtime. Excluded from the project's tsconfig + skipped by lint.
            ignores: ['tests/type-error-fixtures/**']
        },
        {
            // Deno requires explicit `.mjs` on relative imports; the target is the built
            // dist/ (off the node_modules resolver); assertion literals are intentional.
            files: ['tests/integration/**/*.mjs', 'tests/integration/**/*.ts'],
            rules: {
                'import/no-useless-path-segments': 'off',
                'import/no-unresolved': 'off',
                'no-magic-numbers': 'off'
            }
        }
    ]
});
