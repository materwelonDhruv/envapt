import type { StandardSchemaV1 } from '../infra/StandardSchema';

// Msg rides in the alias name so a TS error surfaces the human-readable explanation.
declare const _envaptErrBrand: unique symbol;

// the unique-symbol brand can't be produced from user code, so the message can't be copy-pasted to satisfy the type.
type Err<Msg extends string> = Msg & { readonly [_envaptErrBrand]: never };

type SchemaMustBeSync =
    Err<'Schema must be synchronous. envapt is boot-time config loading; async refinements (validate returning `Promise<Result>`) belong outside the env layer.'>;

type SchemaConstraint<Schema extends StandardSchemaV1> =
    ReturnType<Schema['~standard']['validate']> extends Promise<unknown> ? SchemaMustBeSync : Schema;

export type { Err, SchemaMustBeSync, SchemaConstraint };
