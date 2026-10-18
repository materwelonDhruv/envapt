---
'envapt': major
---

**BREAKING:** `getUsing`, `getWith`, and `parse` are now one method, `Envapter.getAs`. It takes a converter token, a custom function, or a Standard Schema in the same position, as in `Envapter.getAs('PORT', Converters.Port, 3000)`.
