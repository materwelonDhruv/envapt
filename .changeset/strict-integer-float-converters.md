---
'envapt': major
---

**BREAKING:** Tighten the `Integer` and `Float` converters.

`Converters.Integer` parses with `Number` and requires `Number.isSafeInteger`, so trailing characters (`42abc`), non-integers (`3.9`), and values past 2^53 now fall back. `Converters.Float` parses with `Number`, so trailing characters (`3.14xyz`) now fall back. `Float` still accepts `Infinity`.
