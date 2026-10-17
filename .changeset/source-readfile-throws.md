---
'envapt': patch
---

An error that a custom `FileCapableSource`'s `readFile` throws while loading a `.env` file now reaches the caller. envapt used to skip that file and log a warning only under `Envapter.debug = 'warn'`.
