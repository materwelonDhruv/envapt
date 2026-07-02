// getRequiredAll key casing, split on underscores. infra/recase.ts must produce the same keys at runtime.
type KeyCasing = 'camelCase' | 'PascalCase' | 'kebab-case';

type SnakeToPascal<Str extends string> = Str extends `${infer Head}_${infer Tail}`
    ? `${Capitalize<Lowercase<Head>>}${SnakeToPascal<Tail>}`
    : Capitalize<Lowercase<Str>>;

// an empty segment (leading, trailing, or doubled underscore) is not a word, so the accumulator only
// puts a hyphen between non-empty words, staying in step with recase's empty-segment filter at runtime.
type SnakeToKebab<Str extends string, Acc extends string = ''> = Str extends `${infer Head}_${infer Tail}`
    ? SnakeToKebab<Tail, Head extends '' ? Acc : Acc extends '' ? Lowercase<Head> : `${Acc}-${Lowercase<Head>}`>
    : Str extends ''
      ? Acc
      : Acc extends ''
        ? Lowercase<Str>
        : `${Acc}-${Lowercase<Str>}`;

type RecaseKey<Key extends string, Casing> = Casing extends 'camelCase'
    ? Uncapitalize<SnakeToPascal<Key>>
    : Casing extends 'PascalCase'
      ? SnakeToPascal<Key>
      : Casing extends 'kebab-case'
        ? SnakeToKebab<Key>
        : Key;

export type { KeyCasing, RecaseKey };
