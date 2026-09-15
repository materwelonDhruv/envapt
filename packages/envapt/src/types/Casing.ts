// if you change these types, change infra/recase.ts to match
type KeyCasing = 'camelCase' | 'PascalCase' | 'kebab-case';

type SnakeToPascal<Str extends string> = Str extends `${infer Head}_${infer Tail}`
    ? `${Capitalize<Lowercase<Head>>}${SnakeToPascal<Tail>}`
    : Capitalize<Lowercase<Str>>;

// skips the empty segments that leading, trailing, or doubled underscores leave, like recase's filter
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
