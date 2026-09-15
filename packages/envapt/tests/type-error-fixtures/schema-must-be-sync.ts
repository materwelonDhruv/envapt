import { Envapt } from '../../src/legacy';

import type { StandardSchemaV1 } from '../../src/infra/StandardSchema';

// validate returns a Promise here, like an async-only schema library
declare const asyncSchema: StandardSchemaV1<string, string> & {
    readonly '~standard': {
        readonly validate: (value: unknown) => Promise<StandardSchemaV1.Result<string>>;
    };
};

export class AsyncSchemaUser {
    @Envapt('VALUE', { schema: asyncSchema })
    static readonly value: string | undefined;
}
