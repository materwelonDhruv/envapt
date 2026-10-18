---
'envapt': major
---

**BREAKING:** `getSymbol` and `Converters.Symbol` are removed, and a symbol fallback with no converter now throws `FallbackConverterTypeMismatch`. Read the string and call `Symbol.for()` yourself, as in `Symbol.for(Envapter.get('CACHE_NAMESPACE', 'default'))`.
