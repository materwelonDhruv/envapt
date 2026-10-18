---
'envapt': major
---

**BREAKING:** The instance methods on `Envapter` are removed, and `getRaw` is now static. Replace `new Envapter().get(key)` with `Envapter.get(key)`, and `this.get(key)` in a subclass with `Config.get(key)` on that subclass.
