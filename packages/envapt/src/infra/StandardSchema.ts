/**
 * Standard Schema V1 interface. Inlined verbatim from the spec at https://standardschema.dev
 * so envapt has zero runtime peer dependencies on any specific schema library
 * (zod / valibot / arktype / etc).
 *
 * envapt accepts synchronous schemas only. A `validate` that returns a Promise fails to
 * type-check and throws `InvalidUserDefinedConfig` at runtime.
 *
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/standard-schema#any-conformant-validator-or-none}
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
    /** The Standard Schema entry point holding the validator and the inferred input/output types. */
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

// internal alias of StandardSchemaV1.InferOutput, used by the parse and decorator return types
export type InferSchemaOutput<Schema extends StandardSchemaV1> = StandardSchemaV1.InferOutput<Schema>;
