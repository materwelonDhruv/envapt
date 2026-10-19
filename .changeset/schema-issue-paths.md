---
'envapt': major
---

**BREAKING:** Each issue on a `SchemaValidationFailed` from `getAs` or `@Envapt({ schema })` now has the env key first in its `path`. The error message now lists only the key, as in `Validation failed for PORT.`, and leaves out the schema's message.
