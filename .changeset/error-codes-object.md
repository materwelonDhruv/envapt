---
'envapt': major
---

**BREAKING:** `EnvaptErrorCodes` is now a plain object, and `EnvaptErrorCodes[305]` returns `undefined`. Write a type like `EnvaptErrorCodes.MissingEnvValue` as `typeof EnvaptErrorCodes.MissingEnvValue` or `305`.
