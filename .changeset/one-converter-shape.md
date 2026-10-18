---
'envapt': major
---

**BREAKING:** A custom converter for `getAs` or `@Envapt` now takes only the raw string and runs only when the variable is set, and a result of `undefined` or `null` now returns the fallback. A decorated field with a custom converter and no fallback now needs a `T | undefined` type. `ConverterFunction<T>` now takes only the return type and replaces `CustomElementConverter`, and an array element converter that returns `null` now throws `ArrayElementConversionFailed`.
