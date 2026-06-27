---
'envapt': patch
---

Fixed: `syncProcessEnv` and `import 'envapt/config'` now mirror template-resolved values to `process.env`, matching `Envapter.get`.

Also, verbose debug logging reports the base directory in use now.
