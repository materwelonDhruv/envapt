---
'envapt': minor
---

Legacy decorated properties now throw a clear error when you assign to them. `@Envapt` and the sugar decorators (from `envapt/legacy`) install a setter that throws `EnvaptError` with code `InvalidUserDefinedConfig`, because the value resolves from the environment and is read-only. Before, the property had only a getter, so an assignment was a silent no-op in sloppy mode and a native `TypeError` in strict mode. The modern decorators on `envapt` behave the same way.
