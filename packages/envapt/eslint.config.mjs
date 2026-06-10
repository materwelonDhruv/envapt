import createConfig from '@seedcord/eslint-config';

export default createConfig({
    tsconfigRootDir: import.meta.dirname,
    userConfigs: [
        {
            // Test files.
            files: ['tests/**/*.test.ts'],
            rules: {
                '@typescript-eslint/no-unused-expressions': 'off',
                'max-nested-callbacks': ['warn', 10],
                'max-lines': ['warn', { max: 600 }],

                // Decorator fixtures are static-only classes by design
                '@typescript-eslint/no-extraneous-class': 'off'
            }
        },
        {
            // Type-error fixtures: intentionally broken code consumed by the compiler-API
            // test at runtime. Excluded from the project's tsconfig + skipped by lint.
            ignores: ['tests/type-error-fixtures/**']
        },
        {
            // Integration suites import the built dist/ off the node_modules resolver, so the linter
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
        }
    ]
});
