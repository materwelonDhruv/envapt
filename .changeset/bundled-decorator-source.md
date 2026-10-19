---
'envapt': patch
---

Fixed a bundled Node app that reads config only through `@Envapt` throwing `NoSourceBound` on the first read. The bundle now reads `process.env` and your `.env` files even when your code never imports `Envapter`.
