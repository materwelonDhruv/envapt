---
'envapt': patch
---

`Converters.Time` string fallbacks now accept decimals, matching raw env values.

A fallback like `'1.5h'` previously threw `MalformedTimeFallback` even though the `TimeFallback` type (`` `${number}${TimeUnit}` ``) accepts it at compile time. Raw env values already allowed decimals, so the restriction only applied to fallbacks, which was inconsistent. A string fallback still requires an explicit unit (a unitless number is a number fallback), but `'1.5h'` now resolves to `5400000`.
