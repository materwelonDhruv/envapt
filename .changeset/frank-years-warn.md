---
'envapt': patch
---

Fix the read cache rebuilding on every access when a bound source and the `.env` cascade resolve to no keys. It now builds once per `useSource`, matching a non-empty source.
