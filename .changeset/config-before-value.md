---
'envapt': major
---

**BREAKING:** A mistyped converter now throws on every read, as in `getAs('MISSING', 'nmber')` throwing `InvalidBuiltInConverter` where it used to return `undefined`. A malformed time-string fallback now throws even when the variable is set. `get`, `getNumber`, `getBoolean`, and `getBigInt` now throw `FallbackConverterTypeMismatch` for a fallback of the wrong type, as in `getNumber('PORT', '80')`.
