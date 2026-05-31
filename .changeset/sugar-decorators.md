---
'envapt': minor
---

Add per-type shorthand decorators: `@EnvNum`, `@EnvStr`, `@EnvBool`, `@EnvUrl`, `@EnvTime`.

Each is a thin wrapper over `@Envapt` with a fixed converter, so the call site is the key and an optional fallback (`@EnvNum('PORT', 3000)`). The fallback is typed to the converter: `@EnvUrl` takes a `URL`, `@EnvTime` a millisecond number or a time string, the rest their primitive. They accept the ordered-key array form and resolve through the same cache, getter install, and strict-mode path as `@Envapt`. For `required`, a `schema`, an array, or a custom converter, use `@Envapt` with the options object.
