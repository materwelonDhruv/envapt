import type { ConverterFunction } from '../types';

const SCALAR = {
    String: 'string',
    Number: 'number',
    Boolean: 'boolean',
    BigInt: 'bigint',
    Integer: 'integer',
    Float: 'float',
    Json: 'json',
    Url: 'url',
    RegExp: 'regexp',
    Date: 'date',
    Time: 'time',
    Port: 'port',
    Email: 'email'
} as const;

export type ConverterToken = (typeof SCALAR)[keyof typeof SCALAR];

// json and regexp always parse the whole string
type ArrayElement = Exclude<ConverterToken, 'json' | 'regexp'> | ConverterFunction;

// TElement keeps the element type when the converter is stored in a variable first
export interface ArrayOf<TElement extends ArrayElement = ArrayElement> {
    readonly __envaptKind: 'array';
    readonly of: TElement;
    readonly delimiter: string;
}

export function isArrayOf(value: unknown): value is ArrayOf {
    return typeof value === 'object' && value !== null && '__envaptKind' in value && value.__envaptKind === 'array';
}

type ArrayScalarElement = Exclude<ConverterToken, 'json' | 'regexp'>;

function buildArrayConverter<TConverter extends ConverterFunction>(opts: {
    of: TConverter;
    delimiter?: string;
}): ArrayOf<TConverter>;
function buildArrayConverter<TToken extends ArrayScalarElement>(opts: {
    of: TToken;
    delimiter?: string;
}): ArrayOf<TToken>;
function buildArrayConverter(opts?: { delimiter?: string }): ArrayOf<'string'>;
function buildArrayConverter(opts?: { of?: ArrayElement; delimiter?: string }): ArrayOf<ArrayElement> {
    return {
        __envaptKind: 'array',
        of: opts?.of ?? SCALAR.String,
        delimiter: opts?.delimiter ?? ','
    };
}

/**
 * Built-in converters for environment variables. A scalar token such as `Converters.Number`
 * converts a single value. The {@link Converters.array} builder converts a delimited list.
 *
 * @example
 * ```ts
 * \@Envapt('PORT', { converter: Converters.Port, fallback: 3000 })
 * static accessor port: number;
 *
 * \@Envapt('TAGS', { converter: Converters.array({ of: Converters.String, delimiter: ' ' }) })
 * static accessor tags: string[];
 * ```
 *
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/converters#built-in-tokens}
 */
export const Converters = {
    ...SCALAR,
    array: buildArrayConverter
} as const;
