---
'envapt': major
---

**BREAKING:** `getWith` and `parse` are removed, since `getUsing` now takes a custom function or a Standard Schema as well as a token. Replace `getWith(key, fn, fallback)` with `getUsing(key, fn, fallback)`, where `fn` now takes only the raw string, and `parse(key, schema, fallback)` with `getUsing(key, schema, fallback)`.
