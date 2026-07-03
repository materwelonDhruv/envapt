---
'envapt': patch
---

Fix ordered-key reads to keep trying past a present-but-empty candidate. `Envapter.get(['PRIMARY', 'FALLBACK'])` now falls through to `FALLBACK` when `PRIMARY` is set but empty, matching `getRequired` and the documented "first key with a value wins" behavior. A single key set to an empty string still resolves as before.
