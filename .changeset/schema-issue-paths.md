---
'envapt': major
---

**BREAKING:** Each issue on a `SchemaValidationFailed` from `getAs` or `@Envapt({ schema })` now has the env key first in its `path`, and a schema that fails with no issues gives one issue with the message `no issue message`. The error message now lists only the key, as in `Validation failed for PORT.`, where it used to include the first issue's message.
