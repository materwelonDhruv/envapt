---
'envapt': major
---

**BREAKING:** `Envapter.environment` now returns the environment's name, like `'production'`, where it used to return a number. Setting it to anything but a string now throws `InvalidUserDefinedConfig`. A type annotation like `Environment.Test` becomes `'test'`.
