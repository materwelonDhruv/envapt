---
'envapt': minor
---

`getRequired` now takes a Standard Schema, as in `Envapter.getRequired('PORT', z.coerce.number())`. A missing value throws `MissingEnvValue`, and a value the schema rejects throws `InvalidEnvValue` with the schema's issues.
