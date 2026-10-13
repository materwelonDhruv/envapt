---
'envapt': minor
---

`getRequiredAll` now takes a synchronous Standard Schema for any field, next to converters. Every field that fails now goes into one `SchemaValidationFailed` error, including a converter field that used to throw `MissingEnvValue` on its own.
