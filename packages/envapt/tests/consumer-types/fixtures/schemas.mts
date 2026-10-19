import type { StandardSchemaV1 } from 'envapt';

export const poolSchema: StandardSchemaV1<unknown, number> = {
    '~standard': {
        version: 1,
        vendor: 'consumer',
        validate: (value) => {
            const n = Number(value);
            return Number.isInteger(n) ? { value: n } : { issues: [{ message: 'not an integer' }] };
        }
    }
};

export const levelSchema: StandardSchemaV1<unknown, 'debug' | 'info'> = {
    '~standard': {
        version: 1,
        vendor: 'consumer',
        validate: (value) =>
            value === 'debug' || value === 'info' ? { value } : { issues: [{ message: 'unknown level' }] }
    }
};
