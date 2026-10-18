---
'envapt': major
---

**BREAKING:** A schema read through `getUsing` or `@Envapt({ schema })` without a fallback now returns `undefined` for a missing value, where they used to throw `MissingEnvValue`. Use `getRequired` or `required: true` to throw. `@Envapt({ schema, required: true })` now throws `InvalidEnvValue` for a rejected value, the same as `getRequired`, where it used to throw `SchemaValidationFailed`.
