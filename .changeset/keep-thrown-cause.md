---
'envapt': minor
---

When your parser or schema throws in `getRequired`, `getRequiredAll`, or a `required` decorator field, the `InvalidEnvValue` issue for that key now keeps the thrown error as `cause`.
