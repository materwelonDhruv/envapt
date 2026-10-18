---
'envapt': major
---

**BREAKING:** `getWith` and `parse` are removed, since `getUsing` now takes a custom function or a Standard Schema as well as a token. Replace `getWith(key, fn, fallback)` and `parse(key, schema, fallback)` with `getUsing` and the same arguments.
