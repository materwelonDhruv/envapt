---
'envapt': major
---

**BREAKING:** A bad converter now throws even when the env var is missing, as in `getUsing('MISSING', 'nmber')` throwing `InvalidBuiltInConverter` where it used to return `undefined`. A required read now throws that error before `MissingEnvValue`, and a malformed time-string fallback throws even when the value is set. `get`, `getNumber`, `getBoolean`, and `getBigInt` now throw `FallbackConverterTypeMismatch` for a fallback of the wrong type, as in `getNumber('PORT', '80')` from JavaScript.
