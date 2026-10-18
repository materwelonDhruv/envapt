---
'envapt': major
---

**BREAKING:** A custom converter passed to `getUsing` or `@Envapt` is now called as `(raw: string)` only when the variable is set. A missing variable or a converter result of `undefined` or `null` returns the fallback, and a decorated field with no fallback now needs a `T | undefined` type. `ConverterFunction` now takes only the return type as its type parameter and replaces `CustomElementConverter`, and an array element converter that returns `null` now throws `ArrayElementConversionFailed`.
