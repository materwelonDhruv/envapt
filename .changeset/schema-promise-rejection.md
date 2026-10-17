---
'envapt': patch
---

Fixed a zod schema whose `.transform` throws crashing Node with an unhandled rejection after envapt threw `InvalidUserDefinedConfig`.
