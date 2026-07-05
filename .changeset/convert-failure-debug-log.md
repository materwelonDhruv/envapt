---
'envapt': patch
---

Under `Envapter.debug = 'verbose'`, log when a present value cannot be parsed by a built-in converter and the read falls back to its default. This surfaces a malformed value (for example a non-numeric `PORT`) that would otherwise fall back silently.
