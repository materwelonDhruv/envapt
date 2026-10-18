---
'envapt': major
---

**BREAKING:** `String`, `Number`, `Boolean`, `BigInt`, and `Symbol` are no longer converters, and passing one fails to compile and throws `InvalidUserDefinedConfig`. Use `Converters.String`, `Converters.Number`, `Converters.Boolean`, or `Converters.BigInt`. The `PrimitiveCoercionFailed` (205) code is removed.
