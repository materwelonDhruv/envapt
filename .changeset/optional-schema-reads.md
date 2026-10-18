---
'envapt': major
---

**BREAKING:** A schema read through `getAs` or `@Envapt({ schema })` without a fallback now returns `undefined` for a missing value, where `parse` and the decorator used to throw `MissingEnvValue`. Use `getRequired` or `required: true` to keep the throw, or type the decorated field as `T | undefined`.
