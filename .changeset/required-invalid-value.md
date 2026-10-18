---
'envapt': major
---

**BREAKING:** `getRequired`, `getRequiredAll`, and `@Envapt` with `required: true` now throw the new `InvalidEnvValue` (210) for a value that is set but bad, with an issue for each failure whose `path` starts with the env key. A value the converter can't convert used to throw `MissingEnvValue` from the functions and return `undefined` or `null` from the decorator. A bad array element, an error your parser throws, or a schema that rejects or throws used to throw `ArrayElementConversionFailed`, `EmptyArrayElement`, your own error, `SchemaValidationFailed`, or `SchemaThrew`.
