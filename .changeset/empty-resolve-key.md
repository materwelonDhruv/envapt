---
'envapt': patch
---

Fixed an empty key in an `Envapter.resolve` slot being skipped. That slot now throws `InvalidKeyInput`, the same as `get`.
