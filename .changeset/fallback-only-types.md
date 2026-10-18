---
'envapt': patch
---

Fixed `@Envapt('KEY', { fallback })` compiling with an object or array fallback and no converter, where the first read threw `FallbackConverterTypeMismatch`. That call is now a compile error.
