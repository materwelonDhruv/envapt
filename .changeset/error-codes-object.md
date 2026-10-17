---
'envapt': major
---

**BREAKING:** `EnvaptErrorCodes[210]` no longer returns `'InvalidEnvValue'` because `EnvaptErrorCodes` is now a plain object. A type annotation like `EnvaptErrorCodes.MissingEnvValue` becomes `typeof EnvaptErrorCodes.MissingEnvValue` or `305`.
