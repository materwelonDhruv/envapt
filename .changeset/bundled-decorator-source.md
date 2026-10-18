---
'envapt': patch
---

Fixed a bundled Node app that reads config only through `@Envapt` throwing `NoSourceBound` on the first read. The bundle dropped the `FileSource` bind along with the unused `Envapter` class, and now keeps it.
