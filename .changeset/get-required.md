---
'envapt': major
---

Add `getRequired(key, converter)` and `getRequiredAll(spec, casing?)` for typed required reads. `getRequired` takes the converter positionally, returns the non-undefined value, and throws `MissingEnvValue` on a missing or empty key. `getRequiredAll` reads a group in one call and returns a typed record, throwing once listing every missing key. Its spec values can be tokens, `array()` tokens, or custom parser functions, and an optional `casing` (`'camelCase'`, `'PascalCase'`, or `'kebab-case'`) renames the record keys.

Breaking: the `{ required: true }` options-bag form of `getUsing` and `getWith` is removed, use `getRequired` instead. The `@Envapt` decorator's `{ required: true }` option is unchanged.
