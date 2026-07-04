---
'envapt': major
---

Trim internal-only exports out of the public API surface, from 36 exported types down to a small core. Gone are the source shape interfaces, the decorator return types, the schema brands, the converter and inference machinery (including the `ConverterToken` and `EnvaptConverter` aliases), the `isArrayOf` guard, the `EnvKeyInput`/`ArrayOf`/`ArrayElement` helpers, and the redundant `InferSchemaInput`/`InferSchemaOutput` aliases. Type inference on the readers and decorators is unchanged, since these types are inferred at the call site or reproducible from the still-public `Source` and `StandardSchemaV1`. For a schema's output type, use your validator's own inference (`z.infer`, valibot's `InferOutput`, arktype's `.infer`) or `StandardSchemaV1.InferOutput`.
