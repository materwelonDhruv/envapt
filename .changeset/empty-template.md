---
'envapt': patch
---

Fixed a value containing an empty `${}` throwing `InvalidKeyInput` when read. The `${}` now stays in the value as text.
