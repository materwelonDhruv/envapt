---
'envapt': patch
---

Fix decorator value caching so a resolved `undefined` (from `fallback: undefined` or a converter that returns `undefined`) is cached once instead of re-resolving on every property access. The modern accessor decorator now throws `EnvaptError` when the runtime's Stage 3 transform does not provide the accessor name, rather than collapsing every accessor to one cache key.
