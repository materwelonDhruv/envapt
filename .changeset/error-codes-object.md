---
'envapt': major
---

**BREAKING:** `EnvaptErrorCodes[305]` no longer returns `'MissingEnvValue'` because `EnvaptErrorCodes` is now a plain object. A type annotation like `EnvaptErrorCodes.MissingEnvValue` becomes `typeof EnvaptErrorCodes.MissingEnvValue` or `305`.
