---
'envapt': major
---

**BREAKING:** `getRequired`, `getRequiredAll`, and `@Envapt` with `required: true` now throw the new `InvalidEnvValue` (210) when a value is set but can't be used. They used to throw `MissingEnvValue`, and the decorator used to return `undefined`. Each failure, including a bad array element, a schema error, or an error your converter threw, is now an entry in `error.issues` with the env key first in its `path`.
