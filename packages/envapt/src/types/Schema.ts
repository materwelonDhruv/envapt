import type { StandardSchemaV1 } from '../StandardSchema';

// The brand makes `Err<>` unsatisfiable from user code: a `unique symbol` key cannot be
// produced externally, so the literal message string can't be copy-pasted to bypass the type.
// `Msg` stays in the alias name so TS errors surface the human-readable explanation.
declare const _envaptErrBrand: unique symbol;
type Err<Msg extends string> = Msg & { readonly [_envaptErrBrand]: never };

type SchemaMustBeSync =
    Err<'Schema must be synchronous. envapt is boot-time config loading; async refinements (validate returning `Promise<Result>`) belong outside the env layer.'>;

// Standalone slot guard: async-returning `validate` resolves to the brand and fails to
// assign.
type SchemaConstraint<Schema extends StandardSchemaV1> =
    ReturnType<Schema['~standard']['validate']> extends Promise<unknown> ? SchemaMustBeSync : Schema;

export type { Err, SchemaMustBeSync, SchemaConstraint };
