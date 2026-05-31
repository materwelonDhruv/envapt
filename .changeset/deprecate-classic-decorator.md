---
'envapt': minor
---

Deprecate the classic positional `@Envapt('KEY', fallback, Converter)` form. It now carries a `@deprecated` JSDoc tag and will be removed in v6; it still works throughout v5. Use the options object: `@Envapt('KEY', { converter, fallback })`.
