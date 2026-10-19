import { EnvaptError, EnvaptErrorCodes } from './Error';

import type { EnvaptIssue } from './Error';
import type { EnvKeyInput } from '../types';

export function formatKeyForError(key: EnvKeyInput): string {
    return Array.isArray(key) ? `[${key.join(', ')}]` : String(key);
}

export function missingValue(key: EnvKeyInput): EnvaptError {
    return new EnvaptError(
        EnvaptErrorCodes.MissingEnvValue,
        `Required environment variable "${formatKeyForError(key)}" is missing or empty.`
    );
}

export function missingValues(keys: readonly EnvKeyInput[]): EnvaptError {
    return new EnvaptError(
        EnvaptErrorCodes.MissingEnvValue,
        `Missing required environment variables: ${keys.map(formatKeyForError).join(', ')}.`
    );
}

export type ValidationCode = typeof EnvaptErrorCodes.SchemaValidationFailed | typeof EnvaptErrorCodes.InvalidEnvValue;

// the message leaves out the issue text because it can quote a secret value
export function validationFailed(
    code: ValidationCode,
    keys: readonly EnvKeyInput[],
    issues: readonly EnvaptIssue[]
): EnvaptError {
    return new EnvaptError(code, `Validation failed for ${keys.map(formatKeyForError).join(', ')}.`, {
        issues,
        cause: soleCause(issues)
    });
}

function soleCause(issues: readonly EnvaptIssue[]): unknown {
    const thrown = issues.filter((issue) => 'cause' in issue);
    return thrown.length === 1 ? thrown[0]?.cause : undefined;
}
