import { defineConfig } from 'react-doctor/api';

export default defineConfig({
    ignore: {
        // scan source only, not built or generated output
        files: ['**/dist/**', '**/.next/**', '**/out/**', '**/.turbo/**', '**/coverage/**'],
        overrides: [
            // shiki-highlighted code and JSON-LD structured data are trusted HTML, not user input
            {
                files: ['**/components/Code.tsx', '**/app/layout.tsx', '**/docs/**/page.tsx', '**/blog/**/page.tsx'],
                rules: ['react-doctor/no-danger']
            },
            // Satori renders the OG images and supports only inline styles, not CSS classes
            { files: ['**/lib/og/**'], rules: ['react-doctor/no-inline-exhaustive-style'] },
            // the wordmark path data is extracted from the brand SVG, so its precision is intentional
            { files: ['**/components/Wordmark.tsx'], rules: ['react-doctor/rendering-svg-precision'] },
            // shown starts false on purpose and flips when the section scrolls into view
            { files: ['**/components/Reveal.tsx'], rules: ['react-doctor/no-initialize-state'] },
            // three small related controls, co-located on purpose and composed by NavControls and TocControls
            { files: ['**/components/ControlButtons.tsx'], rules: ['react-doctor/no-multi-comp'] }
        ]
    }
});
