---
'envapt': major
---

**BREAKING:** The instance methods and the instance `environment`, `isProduction`, `isStaging`, `isDevelopment`, and `isTest` getters on `Envapter` are removed, and `getRaw` is now static. Replace `new Envapter().get(key)` with `Envapter.get(key)`, and `this.get(key)` in a subclass with `Config.get(key)` on that subclass.
