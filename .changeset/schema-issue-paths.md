---
'envapt': major
---

**BREAKING:** Every issue on a `SchemaValidationFailed` from `Envapter.getUsing` and `@Envapt({ schema })` now has the env key as the first entry of its `path`. A schema that fails with no issues now gives one issue with the message `no issue message`.
