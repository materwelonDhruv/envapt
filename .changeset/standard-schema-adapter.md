---
'envapt': minor
---

Add Standard Schema v1 adapter (zod, valibot, arktype, hand-rolled).

- New `schema:` option on `@Envapt`. Synchronous schemas only.
- New `Envapter.parse(key, schema, fallback?)` static + instance methods.
- New `StandardSchemaV1` interface inlined verbatim from <https://standardschema.dev>; `InferSchemaInput<S>` / `InferSchemaOutput<S>` helpers exported from the package root. Zero runtime peer dependencies.
- New error codes: `SchemaValidationFailed (208)` populates `err.issues` with the schema's `~standard.validate` issue array; `SchemaThrew (209)` chains the underlying throw via `Error.cause`.
- Schema slot is mutually exclusive with `converter`: combining them fails to match any overload at compile time, and the runtime Validator throws `InvalidUserDefinedConfig` for dynamic objects that bypass the types.
- Async-validating schemas resolve the type slot to the `SchemaMustBeSync` brand; the Parser also throws if a Promise leaks past the type check.
- Missing env + fallback returns the fallback as-is without re-validating it through the schema.
