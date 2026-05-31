---
"envapt": patch
---

Instance `get` now narrows its return type on a fallback. A redundant overload made `env.get('KEY', 'fallback')` resolve to `string | undefined` instead of `string`; removing it makes instance `get` match static `get`.
