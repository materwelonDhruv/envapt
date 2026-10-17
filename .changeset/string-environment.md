---
'envapt': major
---

**BREAKING:** `Envapter.environment` now returns the environment's name, like `'production'`, where it used to return a number. `Environment.Production` still works as a value, and `configureProfiles` now also takes plain keys like `production`. A type annotation like `Environment.Test` becomes `'test'`.
