---
'envapt': patch
---

Fixed a legacy decorator throwing `Cannot redefine property` under a Babel-based loader. The decorator now returns the descriptor it installed, and Babel reapplies that one.
