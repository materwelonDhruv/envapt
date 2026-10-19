---
'envapt': patch
---

Fixed setting `Envapter.strict` or `Envapter.environment` before `useSource` throwing `NoSourceBound` on Workers, the browser, and edge runtimes. The setting now applies when you bind the source.
