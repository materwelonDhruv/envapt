---
'envapt': major
---

**BREAKING:** A mistyped converter now throws on every read, as in `getAs('MISSING', 'nmber')` throwing `InvalidBuiltInConverter` where it used to return `undefined`. A malformed time-string fallback now throws even when the variable is set. `get` now throws `FallbackConverterTypeMismatch` for a fallback that isn't a string, as in `get('PORT', 80)`.
