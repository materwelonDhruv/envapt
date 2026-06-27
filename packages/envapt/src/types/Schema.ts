import type { StandardSchemaV1 } from '../infra/StandardSchema';

// `Msg` rides in the alias name so a TS error surfaces the human-readable explanation.
declare const _envaptErrBrand: unique symbol;

/**
 * A branded string carrying a compile-time error message. The `unique symbol` brand cannot be
 * produced from user code, so the message string can't be copy-pasted to satisfy the type.
 */
type Err<Msg extends string> = Msg & { readonly [_envaptErrBrand]: never };

/**
 * The {@link Err} returned when a Standard Schema's `validate` is async. envapt loads config at boot,
 * so async refinements are rejected at the type level.
 */
type SchemaMustBeSync =
    Err<'Schema must be synchronous. envapt is boot-time config loading; async refinements (validate returning `Promise<Result>`) belong outside the env layer.'>;

/**
 * Resolves to the schema when its `validate` is synchronous, or {@link SchemaMustBeSync} when it
 * returns a Promise.
 */
type SchemaConstraint<Schema extends StandardSchemaV1> =
    ReturnType<Schema['~standard']['validate']> extends Promise<unknown> ? SchemaMustBeSync : Schema;

export type { Err, SchemaMustBeSync, SchemaConstraint };
