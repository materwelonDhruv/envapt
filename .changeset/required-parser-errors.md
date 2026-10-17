---
'envapt': major
---

**BREAKING:** When an array element is bad or your custom parser throws, `getRequired` and `getRequiredAll` now throw `SchemaValidationFailed` with that error's message as an issue. They used to throw `ArrayElementConversionFailed`, `EmptyArrayElement`, or your parser's own error.
