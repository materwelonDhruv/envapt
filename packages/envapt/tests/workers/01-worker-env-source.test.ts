import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';

import { Converters, Envapter, WorkerEnvSource } from '../../dist/workerd/index.mjs';

describe('WorkerEnvSource on workerd', () => {
    beforeEach(() => {
        Envapter.useSource(new WorkerEnvSource(env as Record<string, unknown>));
    });

    it('reads typed values from the Worker env binding', () => {
        expect(Envapter.get('APP_NAME')).toBe('envapt');
        expect(Envapter.getNumber('PORT')).toBe(8787);
        expect(Envapter.getBoolean('DEBUG')).toBe(true);
        expect(Envapter.getUsing('API_URL', Converters.Url)?.href).toBe('https://api.example.com/v1');
    });

    it('applies the array and json converters to bindings', () => {
        expect(Envapter.getUsing('TAGS', Converters.array())).toEqual(['a', 'b', 'c']);
        expect(Envapter.getUsing('FEATURES', Converters.Json)).toEqual({ beta: true });
    });

    it('expands ${VAR} template references inside a binding value', () => {
        expect(Envapter.get('GREETING')).toBe('Hello envapt');
    });

    it('resolves the tagged template against bindings', () => {
        expect(Envapter.resolve`${'APP_NAME'}:${'PORT'}`).toBe('envapt:8787');
    });
});
