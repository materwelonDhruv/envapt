---
'envapt': major
---

**BREAKING:** `@Envapt({ converter, required: true })` now throws `InvalidEnvValue` when the value is set but the converter can't convert it. It used to return `undefined`, or `null` from a custom converter.
