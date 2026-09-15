import type { StandardSchemaV1 } from '../infra/StandardSchema';

// a pasted copy of the message string cannot carry this brand
declare const _envaptErrBrand: unique symbol;

// tsc prints Msg in the error
type Err<Msg extends string> = Msg & { readonly [_envaptErrBrand]: never };

type SchemaMustBeSync =
    Err<'Schema must be synchronous. envapt is boot-time config loading; async refinements (validate returning `Promise<Result>`) belong outside the env layer.'>;

type SchemaConstraint<Schema extends StandardSchemaV1> =
    ReturnType<Schema['~standard']['validate']> extends Promise<unknown> ? SchemaMustBeSync : Schema;

export type { SchemaConstraint };
