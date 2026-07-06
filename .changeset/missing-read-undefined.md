---
'envapt': major
---

Return `undefined` for a missing read with no fallback across every reader, including the decorators and converter dispatch that returned `null` before. No-fallback decorator field types drop `| null` and retype such fields to `| undefined`. `getWith` now runs its custom converter on a missing key with `raw` as `undefined`. An explicit `undefined` fallback counts as no fallback everywhere, so `Envapter.parse(key, schema, undefined)` throws `MissingEnvValue`.
