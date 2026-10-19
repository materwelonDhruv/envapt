---
'envapt': major
---

**BREAKING:** A custom converter now gets only the raw string, and envapt calls it only when the variable is set. If it returns `undefined` or `null`, you get the fallback, and inside `Converters.array` that throws `ArrayElementConversionFailed`. `ConverterFunction<T>` now takes one type argument and replaces `CustomElementConverter`.
