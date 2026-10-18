---
'envapt': major
---

**BREAKING:** `parse` and `@Envapt({ schema })` without a fallback now return `undefined` for a missing value, where they used to throw `MissingEnvValue`. Use `getRequired` or `required: true` to throw. `@Envapt({ schema, required: true })` now throws `InvalidEnvValue` for a rejected value, the same as `getRequired`, where it used to throw `SchemaValidationFailed`.
