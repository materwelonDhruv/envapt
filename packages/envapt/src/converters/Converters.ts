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
    Time: 'time',
    Port: 'port',
    Email: 'email'
} as const;

export type ConverterToken = (typeof SCALAR)[keyof typeof SCALAR];

/**
 * Custom element converter for use inside {@link Converters.array}. Receives the trimmed,
 * non-empty raw string for one array slot and returns the parsed value.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/converters#custom-converters}
 */
export type CustomElementConverter<TReturn = unknown> = (raw: string) => TReturn;

// json/regexp are not allowed as array elements because they consume the whole string and cannot be split into slots
export type ArrayElement = Exclude<ConverterToken, 'json' | 'regexp'> | CustomElementConverter;

// phantom type branded with __envaptKind for runtime dispatch. TElement preserves
// element converter type through variable indirection for type inference
export interface ArrayOf<TElement extends ArrayElement = ArrayElement> {
    readonly __envaptKind: 'array';
    readonly of: TElement;
    readonly delimiter: string;
}

export function isArrayOf(value: unknown): value is ArrayOf {
    return typeof value === 'object' && value !== null && '__envaptKind' in value && value.__envaptKind === 'array';
}

type ArrayScalarElement = Exclude<ConverterToken, 'json' | 'regexp'>;

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
 * @see {@link https://envapt.materwelon.dev/docs/converters#built-in-tokens}
 */
export const Converters = {
    ...SCALAR,
    array: buildArrayConverter
} as const;
