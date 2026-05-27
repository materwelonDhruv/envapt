---
'envapt': major
---

**BREAKING:** array converters now use a phantom-branded `Converters.array({ of?, delimiter? })` builder instead of the `{ delimiter, type }` config object. inference survives variable indirection and union-widening, and bad element values in the raw env value throw `EnvaptError` (`ArrayElementConversionFailed`, code 206) instead of silently substituting the raw string into a wrong-typed array.

Migration:

```ts
// before
@Envapt('PORTS', { converter: { delimiter: ',', type: Converters.Number }, fallback: [] })
@Envapt('TAGS', { converter: Converters.Array, fallback: [] })

// after
@Envapt('PORTS', { converter: Converters.array({ of: Converters.Number }), fallback: [] })
@Envapt('TAGS', { converter: Converters.array(), fallback: [] })
```

**BREAKING:** `Converters` migrates from a TS `enum` to an `as const` object so envapt source stays compatible with `erasableSyntaxOnly` / Node's native TS execution. call sites are unchanged (`Converters.Number === 'number'` still holds), but `Converters` is no longer usable as a type. use `ConverterToken` instead.

**BREAKING:** `Converters.Array` token is gone (use `Converters.array()`). the `ArrayConverter` and `ValidArrayConverterBuiltInType` types are gone (replaced by `ArrayOf<TElement>` and `ArrayElement`).

new: `of:` accepts a custom `(raw: string) => T` function. the array element type is inferred from the function's return type, so `Converters.array({ of: (raw) => User.parse(raw) })` types the property as `User[]`.

new: `Converters.array({ of: Converters.Time })` accepts `TimeFallback[]` (e.g. `['5s', '10m']`) as a fallback, matching the existing scalar `Converters.Time` asymmetry. string fallbacks are coerced to milliseconds at resolve time.

`Envapter.getUsing` now routes through the parser whenever a fallback is provided, so `TimeFallback` / `TimeFallback[]` fallbacks are coerced consistently with the `@Envapt` decorator path. fixes a pre-existing inconsistency where `Envapter.getUsing('MISSING', Converters.Time, '10s')` returned `'10s'` instead of `10000`.
