---
'envapt': minor
---

Each slot in `Envapter.resolve` now takes an ordered key list, as in ``Envapter.resolve`${['READONLY_URL', 'DATABASE_URL']}` ``, and reads the first key with a value.
