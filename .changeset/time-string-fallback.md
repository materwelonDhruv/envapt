---
'envapt': minor
---

`Converters.Time` fallbacks now accept a time-string in addition to a number — `fallback: '10s'` is the same as `fallback: 10000`. also adds `d` (days) and `w` (weeks) to the supported units. `TimeFallback` is exported if you want to type the fallback yourself.

malformed time-string fallbacks (like `'1.5h'` or `'1500'` — runtime expects an integer with an explicit unit) now throw `EnvaptErrorCodes.MalformedTimeFallback` instead of the generic `FallbackConverterTypeMismatch`. number fallbacks keep working the same way.
