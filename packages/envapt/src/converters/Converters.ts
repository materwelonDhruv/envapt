const SCALAR = {
    String: 'string',
    Number: 'number',
    Boolean: 'boolean',
    Bigint: 'bigint',
    Symbol: 'symbol',
    Integer: 'integer',
    Float: 'float',
    Json: 'json',
    Url: 'url',
    Regexp: 'regexp',
    Date: 'date',
    Time: 'time'
} as const;

/**
 * String tokens for every built-in scalar converter.
 * @public
 */
export type ConverterToken = (typeof SCALAR)[keyof typeof SCALAR];

/**
 * Custom element converter for use inside {@link Converters.array}. Receives the trimmed,
 * non-empty raw string for one array slot and returns the parsed value.
 * @public
 */
export type CustomElementConverter<TReturn = unknown> = (raw: string) => TReturn;

// array element converters, any scalar token except json/regexp (those don't compose) or a custom function
export type ArrayElement = Exclude<ConverterToken, 'json' | 'regexp'> | CustomElementConverter;

// phantom-branded token from Converters.array. TElement carries the element converter through variable
// indirection so inference survives. __envaptKind is the runtime dispatch discriminant.
export interface ArrayOf<TElement extends ArrayElement = ArrayElement> {
    readonly __envaptKind: 'array';
    readonly of: TElement;
    readonly delimiter: string;
}

/**
 * Runtime type guard for tokens produced by {@link Converters.array}.
 * @internal
 */
export function isArrayOf(value: unknown): value is ArrayOf {
    return typeof value === 'object' && value !== null && '__envaptKind' in value && value.__envaptKind === 'array';
}

type ArrayScalarElement = Exclude<ConverterToken, 'json' | 'regexp'>;

// Overloads. The function-element overload must come first so it wins inference when `of`
// is a function, otherwise TS picks the scalar branch and `raw` defaults to `any`.
function buildArrayConverter<TReturn>(opts: {
    of: CustomElementConverter<TReturn>;
    delimiter?: string;
}): ArrayOf<CustomElementConverter<TReturn>>;
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
 * Built-in converters for environment variables. Use the scalar tokens (e.g. `Converters.Number`)
 * for primitive types and the {@link Converters.array} builder for delimited lists.
 *
 * @example
 * ```ts
 * \@Envapt('PORT', { converter: Converters.Number, fallback: 3000 })
 * static readonly port: number;
 *
 * \@Envapt('TAGS', { converter: Converters.array({ of: Converters.String, delimiter: ' ' }) })
 * static readonly tags: string[];
 * ```
 *
 * @public
 */
export const Converters = {
    ...SCALAR,
    array: buildArrayConverter
} as const;
