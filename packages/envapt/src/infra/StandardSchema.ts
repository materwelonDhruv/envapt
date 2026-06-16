/**
 * Standard Schema V1 interface. Inlined verbatim from the spec at https://standardschema.dev
 * so envapt has zero runtime peer dependencies on any specific schema library
 * (zod / valibot / arktype / etc).
 *
 * envapt narrows usage to SYNCHRONOUS schemas only: env loading is boot-time,
 * `validate` returning `Promise<Result>` is rejected at the type level (see
 * `SchemaMustBeSync` brand in `Types.ts`) and at runtime by the Parser dispatch.
 *
 * @public
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
    readonly '~standard': StandardSchemaV1.Props<Input, Output>;
}

// eslint-disable-next-line @typescript-eslint/no-namespace -- mirrors the spec layout at standardschema.dev
export namespace StandardSchemaV1 {
    export interface Props<Input = unknown, Output = Input> {
        readonly version: 1;
        readonly vendor: string;
        readonly validate: (value: unknown) => Result<Output> | Promise<Result<Output>>;
        readonly types?: Types<Input, Output> | undefined;
    }

    export type Result<Output> = SuccessResult<Output> | FailureResult;

    export interface SuccessResult<Output> {
        readonly value: Output;
        readonly issues?: undefined;
    }

    export interface FailureResult {
        readonly issues: readonly Issue[];
    }

    export interface Issue {
        readonly message: string;
        readonly path?: readonly (PropertyKey | PathSegment)[] | undefined;
    }

    export interface PathSegment {
        readonly key: PropertyKey;
    }

    export interface Types<Input = unknown, Output = Input> {
        readonly input: Input;
        readonly output: Output;
    }

    export type InferInput<Schema extends StandardSchemaV1> = NonNullable<Schema['~standard']['types']>['input'];

    export type InferOutput<Schema extends StandardSchemaV1> = NonNullable<Schema['~standard']['types']>['output'];
}

/**
 * Envapt-side alias for {@link StandardSchemaV1.InferOutput}. Re-exported under a friendlier
 * name so consumers writing `static readonly x: InferSchemaOutput<typeof mySchema>`
 * don't need the namespace path.
 * @public
 */
export type InferSchemaOutput<Schema extends StandardSchemaV1> = StandardSchemaV1.InferOutput<Schema>;

/**
 * Envapt-side alias for {@link StandardSchemaV1.InferInput}.
 * @public
 */
export type InferSchemaInput<Schema extends StandardSchemaV1> = StandardSchemaV1.InferInput<Schema>;
