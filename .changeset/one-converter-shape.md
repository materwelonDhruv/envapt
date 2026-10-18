---
'envapt': major
---

**BREAKING:** A custom converter passed to `getUsing` or `@Envapt` is now called as `(raw: string)` only when the variable is set, and a missing variable returns the fallback without calling it. A converter result of `undefined` or `null` now returns the fallback, and an array element converter that returns `null` now throws `ArrayElementConversionFailed`. `ConverterFunction` now also types array element converters, and `CustomElementConverter` is removed.
