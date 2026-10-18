import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Envapter } from '../src';
import { Envapt } from '../src/legacy';

describe('Edge cases', () => {
    beforeAll(() => (Envapter.envPaths = resolve(import.meta.dirname, '.env.edge-cases')));

    class TemplateEdgeCases {
        @Envapt('EMPTY_TEMPLATE')
        static readonly emptyTemplate: string | undefined;

        @Envapt('CIRCULAR_TEMPLATE')
        static readonly circularTemplate: string | undefined;

        @Envapt('CIRCULAR_A')
        static readonly circularA: string | undefined;

        @Envapt('CIRCULAR_B')
        static readonly circularB: string | undefined;

        @Envapt('MULTI_TYPE_TEMPLATE')
        static readonly multiTypeTemplate: string | undefined;

        @Envapt('UNICODE_VALUE', { fallback: 'ascii' })
        static readonly unicodeValue: string;
    }

    it('reads unicode characters with the default encoding', () => {
        expect(TemplateEdgeCases.unicodeValue).to.equal('🚀 Hello 世界 🌍');
    });

    it('should preserve template syntax for empty variables', () => {
        expect(TemplateEdgeCases.emptyTemplate).to.equal('${EMPTY_VAR}');
    });

    it('should handle circular template variables', () => {
        expect(TemplateEdgeCases.circularTemplate).to.equal('${CIRCULAR_TEMPLATE}');
    });

    it('should handle circular references between variables', () => {
        expect(TemplateEdgeCases.circularA).to.equal('${CIRCULAR_B}');
        expect(TemplateEdgeCases.circularB).to.equal('${CIRCULAR_A}');
    });

    it('expands several placeholders in one value', () => {
        expect(TemplateEdgeCases.multiTypeTemplate).to.equal('stringVar123true');
    });
});
