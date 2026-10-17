---
'envapt': major
---

**BREAKING:** `getRequired` and `getRequiredAll` now throw `SchemaValidationFailed` for a present value they can't convert, where they used to throw `MissingEnvValue`. `getRequiredAll` now also takes a synchronous Standard Schema for any field and reports every bad field in one error.
