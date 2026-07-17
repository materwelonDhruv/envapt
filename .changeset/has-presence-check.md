---
'envapt': minor
---

Add `Envapter.has(key)`, a boolean presence check that mirrors `getRequired`'s missing semantics, true exactly when a required read of the same key finds a value. Templates resolve first, empty counts as missing, and whitespace-only counts as missing only under strict mode.
