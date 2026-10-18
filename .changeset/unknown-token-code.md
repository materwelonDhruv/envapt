---
'envapt': major
---

**BREAKING:** A mistyped converter token like `'nmber'` now throws `InvalidBuiltInConverter` (202) with the list of valid tokens, where it used to throw `InvalidCustomConverter` (203). The unused `InvalidFallbackType` (102) and `InvalidConverterType` (204) codes are removed.
