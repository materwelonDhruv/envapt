import { Envapt } from '../../src';

import type { StandardSchemaV1 } from '../../src/StandardSchema';

// Schema whose `~standard.validate` is explicitly typed as returning Promise<Result>.
// Reproduces the shape an async-only schema library would expose. The `SchemaConstraint`
// brand resolves the @Envapt schema slot to `SchemaMustBeSync` for this shape.
declare const asyncSchema: StandardSchemaV1<string, string> & {
    readonly '~standard': {
        readonly validate: (value: unknown) => Promise<StandardSchemaV1.Result<string>>;
    };
};

export class AsyncSchemaUser {
    @Envapt('VALUE', { schema: asyncSchema })
    static readonly value: string;
}
