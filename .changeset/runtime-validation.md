---
'envapt': major
---

## Strict Runtime Validation

- **BREAKING**: Runtime type validation between converter return types and fallback values exists now... and it's strict!
  - But only for built-in and array converters. You are free to do what you want with custom converters.
- EnvaptError codes actually make sense now instead of the random numbers they were before
- Added primitive type coercion validation and better error handling

Since this didn't exist before, it will break existing code that was previously passing incorrect types.
