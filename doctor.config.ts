import { defineConfig } from 'react-doctor/api';

export default defineConfig({
    ignore: {
        // scan source only, not built or generated output
        files: ['**/dist/**', '**/.next/**', '**/out/**', '**/.turbo/**', '**/coverage/**'],
        overrides: []
    }
});
