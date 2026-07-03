---
'envapt': patch
---

Move the engine read-path into module functions under core/ so a consumer subclass can no longer reach or mutate the read cache. No public API change.
