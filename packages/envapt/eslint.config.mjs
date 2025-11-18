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
        }
    ]
});
