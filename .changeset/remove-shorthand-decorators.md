---
'envapt': major
---

**BREAKING:** `@EnvStr`, `@EnvNum`, `@EnvBool`, `@EnvTime`, and `@EnvUrl` are removed from `envapt` and `envapt/legacy`. Use `@Envapt` with a converter, as in `@Envapt('CACHE_TTL', { converter: Converters.Time, fallback: '15m' })`.
