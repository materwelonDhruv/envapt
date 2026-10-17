---
'envapt': major
---

**BREAKING:** `getRequired` and `getRequiredAll` now throw `SchemaValidationFailed` when a value is set but can't be converted. They used to throw `MissingEnvValue`.
