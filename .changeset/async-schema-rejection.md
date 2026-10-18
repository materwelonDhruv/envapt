---
'envapt': patch
---

Fixed Node crashing with an unhandled rejection when a zod `.transform` or `.refine` threw during a read. With `Envapter.debug = 'warn'`, envapt now logs that error.
