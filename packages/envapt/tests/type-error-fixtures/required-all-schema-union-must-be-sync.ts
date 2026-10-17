import { Converters, Envapter } from '../../src';

import type { StandardSchemaV1 } from '../../src/infra/StandardSchema';

declare const asyncSchema: StandardSchemaV1<string, string> & {
    readonly '~standard': {
        readonly validate: (value: unknown) => Promise<StandardSchemaV1.Result<string>>;
    };
};
declare const strictParsing: boolean;

export const cfg = Envapter.getRequiredAll({ LOG_LEVEL: strictParsing ? asyncSchema : Converters.String });
