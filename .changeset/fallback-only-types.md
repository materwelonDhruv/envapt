---
'envapt': patch
---

Fixed `@Envapt('KEY', { fallback })` with an object or array fallback and no converter compiling, then throwing `FallbackConverterTypeMismatch` on the first read. That call is now a compile error.
