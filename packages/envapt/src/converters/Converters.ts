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

/**
 * Valid element converters for {@link Converters.array}: any scalar token except
 * `json` and `regexp` (those don't compose as array elements), or a custom function.
 * @public
 */
export type ArrayElement = Exclude<ConverterToken, 'json' | 'regexp'> | CustomElementConverter;

/**
 * Phantom-branded token produced by {@link Converters.array}. The `T` type parameter carries
 * the element converter through any variable indirection so inference survives. The
 * `__envaptKind` discriminant is present at runtime for dispatch.
 * @public
 */
export interface ArrayOf<TElement extends ArrayElement = ArrayElement> {
    /** Runtime discriminant marking this token as an array converter. Don't use directly. */
    readonly __envaptKind: 'array';
    /** The element converter applied to each split slot. */
    readonly of: TElement;
    /** The string the raw value is split on. */
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
