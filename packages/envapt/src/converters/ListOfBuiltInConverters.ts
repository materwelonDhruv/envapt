import type { ConverterToken } from './Converters';
import type { JsonValue } from '../types';

/**
 * List of built-in scalar converters for Envapt. Arrays are handled separately via
 * the {@link Converters.array} builder and the `ArrayOf<...>` brand.
 * @internal
 */
export const ListOfBuiltInConverters: ConverterToken[] = [
    'string',
    'number',
    'boolean',
    'bigint',
    'symbol',
    'integer',
    'float',
    'json',
    'url',
    'regexp',
    'date',
    'time'
] as const;

/**
 * Type checking functions for built-in scalar converter return types.
 * @internal
 */
export const BuiltInConverterTypeCheckers: Record<ConverterToken, (value: unknown) => boolean> = {
    string: (value: unknown): value is string => typeof value === 'string',
    number: (value: unknown): value is number => typeof value === 'number',
    boolean: (value: unknown): value is boolean => typeof value === 'boolean',
    bigint: (value: unknown): value is bigint => typeof value === 'bigint',
    symbol: (value: unknown): value is symbol => typeof value === 'symbol',
    integer: (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value),
    float: (value: unknown): value is number => typeof value === 'number',
    json: (value: unknown): value is JsonValue => {
        try {
            JSON.parse(JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },
    url: (value: unknown): value is URL => value instanceof URL,
    regexp: (value: unknown): value is RegExp => value instanceof RegExp,
    date: (value: unknown): value is Date => value instanceof Date,
    time: (value: unknown): value is number | string => typeof value === 'number' || typeof value === 'string'
};
