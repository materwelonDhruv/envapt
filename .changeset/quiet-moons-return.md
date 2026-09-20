---
'envapt': patch
---

Fixed a legacy decorator throwing `Cannot redefine property` under a Babel-based loader. The decorator returns the descriptor it installed now, which Babel reapplies in place of the plain field.
