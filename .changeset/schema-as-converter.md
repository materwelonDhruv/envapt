---
'envapt': major
---

**BREAKING:** A Standard Schema passed as a converter to `@Envapt` or `Envapter.getWith` now throws `InvalidUserDefinedConfig`. envapt used to call an arktype type as a plain function and hand back its `ArkErrors` object for a bad value.
