---
'envapt': patch
---

`Envapter.debug = 'warn'` now logs whenever a read hits a missing or empty variable, including reads with no fallback and reads through `getUsing`, `getWith`, and `parse`. Previously only a read that fell back to a provided default logged, so a bare `Envapter.get('MISSING')` was silent.
