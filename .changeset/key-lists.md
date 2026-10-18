---
'envapt': minor
---

Each argument to `Envapter.require` and each `Envapter.resolve` slot now takes an ordered key list and uses the first key with a value, as in `Envapter.require(['READONLY_URL', 'DATABASE_URL'], 'API_KEY')`.
