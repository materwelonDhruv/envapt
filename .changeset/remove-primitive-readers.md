---
'envapt': major
---

**BREAKING:** `getNumber`, `getBoolean`, and `getBigInt` are removed. Read the value through `getAs` with the matching converter, as in `Envapter.getAs('DEBUG', Converters.Boolean, false)`, or `Converters.Port` for a port.
