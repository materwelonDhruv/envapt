---
'envapt': patch
---

Fixed `getRequired`, `getRequiredAll`, and a required decorated field rejecting a `Converters.Json` value of `null`. They now return `null`, the same as `getAs`.
