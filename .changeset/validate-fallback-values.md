---
'envapt': major
---

A built-in converter fallback must now be a value the converter would accept. One of the correct type but an invalid value throws `FallbackConverterTypeMismatch`: an out-of-range `Port`, a `NaN` `Number` or `Float`, a non-safe-integer `Integer`, an `Invalid Date`, or an `Email` that is not a valid address. Pass a valid fallback or omit it.
