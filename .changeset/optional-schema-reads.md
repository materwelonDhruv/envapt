---
'envapt': major
---

**BREAKING:** A schema read through `getUsing` or `@Envapt({ schema })` without a fallback now returns `undefined` for a missing value, where they used to throw `MissingEnvValue`. Use `getRequired` or `required: true` to keep the throw, or type the decorated field as `T | undefined`. `@Envapt({ schema, required: true })` now throws `InvalidEnvValue` when its schema rejects a value or throws, the same as `getRequired`, where it used to throw `SchemaValidationFailed` or `SchemaThrew`.
