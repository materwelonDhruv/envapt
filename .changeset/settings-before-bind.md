---
'envapt': patch
---

Fixed `Envapter.strict` and `Envapter.environment` throwing `NoSourceBound` on Workers, the browser, and edge runtimes when set before `useSource`, while still keeping the new value. They now apply when the source is bound.
