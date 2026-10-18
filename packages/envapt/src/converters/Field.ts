import { BuiltInConverters } from './BuiltInConverters';
import { hasFallback, isUnconverted } from '../core/missing';
import { state } from '../core/state';
import { Validator } from '../engine/Validators';
import { debugVerbose, debugWarn } from '../infra/Debug';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';
import { validationFailed } from '../infra/failures';

import type { ArrayOf } from './Converters';
import type { StandardSchemaV1 } from '../infra/StandardSchema';
import type {
    BuiltInConverter,
    BuiltInConverterFunction,
    ConverterFunction,
    PresentValue,
    RequiredSpec
} from '../types';

type SchemaOutcome = StandardSchemaV1.Result<unknown> | Promise<StandardSchemaV1.Result<unknown>>;

export type FieldSpec = RequiredSpec[string];

export interface Field {
    readonly fallback: unknown;
    convert(present: PresentValue): unknown;
    check(present: PresentValue): StandardSchemaV1.Result<unknown>;
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function keyIssues(key: string, outcome: StandardSchemaV1.Result<unknown>): StandardSchemaV1.Result<unknown> {
    if (outcome.issues === undefined) return outcome;
    const issues = outcome.issues.length > 0 ? outcome.issues : [{ message: 'no issue message' }];
    return { issues: issues.map((issue) => ({ message: issue.message, path: [key, ...(issue.path ?? [])] })) };
}

function keyIssue(key: string, message: string): StandardSchemaV1.Result<unknown> {
    return keyIssues(key, { issues: [{ message }] });
}

function timeStringToMs(value: string): unknown {
    return BuiltInConverters.getConverter('time')('', value);
}

abstract class ConverterField implements Field {
    abstract readonly fallback: unknown;
    protected abstract readonly label: string;

    protected abstract parse(raw: string): unknown;

    protected couldNotConvert(converted: unknown): boolean {
        return isUnconverted(converted);
    }

    convert({ key, value }: PresentValue): unknown {
        const converted = this.parse(value);
        if (!this.couldNotConvert(converted)) return converted;
        // leave the value out because env values can be secrets
        debugVerbose(
            `could not convert ${key} ${this.label}${hasFallback(this.fallback) ? ', using the fallback' : ''}`
        );
        return this.fallback;
    }

    check({ key, value }: PresentValue): StandardSchemaV1.Result<unknown> {
        let converted: unknown;
        try {
            converted = this.parse(value);
        } catch (error) {
            return keyIssue(key, errorMessage(error));
        }
        if (isUnconverted(converted)) return keyIssue(key, 'could not be converted');
        return { value: converted };
    }
}

class TokenField extends ConverterField {
    readonly fallback: unknown;
    protected readonly label: string;
    private readonly parseToken: BuiltInConverterFunction;

    constructor(token: BuiltInConverter, fallback: unknown) {
        super();
        if (hasFallback(fallback)) Validator.validateBuiltInConverterFallback(token, fallback);
        this.label = `as ${token}`;
        this.parseToken = BuiltInConverters.getConverter(token);
        this.fallback = token === 'time' && typeof fallback === 'string' ? timeStringToMs(fallback) : fallback;
    }

    protected parse(raw: string): unknown {
        return this.parseToken(raw, undefined);
    }

    // a built-in returns undefined when it fails. json can parse to a real null.
    protected override couldNotConvert(converted: unknown): boolean {
        return converted === undefined;
    }
}

class ArrayField extends ConverterField {
    readonly fallback: unknown;
    protected readonly label = 'as an array';

    constructor(
        private readonly token: ArrayOf,
        fallback: unknown
    ) {
        super();
        Validator.arrayConverter(token);
        this.fallback = fallback;
        if (!hasFallback(fallback)) return;
        if (!Array.isArray(fallback)) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidFallback,
                `ArrayOf<...> requires that the fallback be an array, got ${typeof fallback}`
            );
        }
        Validator.validateArrayFallbackElementTypes(fallback);
        Validator.validateArrayConverterElementTypeMatch(token.of, fallback);
        if (token.of === 'time' && fallback.every((v): v is string => typeof v === 'string')) {
            this.fallback = fallback.map(timeStringToMs);
        }
    }

    protected parse(raw: string): unknown {
        return BuiltInConverters.processArrayConverter(raw, this.token, state.strict);
    }
}

class CustomField extends ConverterField {
    protected readonly label = 'with the custom converter';

    constructor(
        private readonly converter: ConverterFunction,
        readonly fallback: unknown
    ) {
        super();
        Validator.customConvertor(converter);
    }

    protected parse(raw: string): unknown {
        return this.converter(raw);
    }
}

class SchemaField implements Field {
    constructor(
        private readonly schema: StandardSchemaV1,
        readonly fallback: unknown
    ) {}

    convert(present: PresentValue): unknown {
        const run = this.run(present);
        if (run.threw) {
            throw new EnvaptError(
                EnvaptErrorCodes.SchemaThrew,
                `Schema for "${present.key}" threw during validation: ${errorMessage(run.error)}`,
                { cause: run.error }
            );
        }
        if (run.result.issues !== undefined) {
            throw validationFailed(EnvaptErrorCodes.SchemaValidationFailed, [present.key], run.result.issues);
        }
        return run.result.value;
    }

    check(present: PresentValue): StandardSchemaV1.Result<unknown> {
        const run = this.run(present);
        return run.threw ? keyIssue(present.key, errorMessage(run.error)) : run.result;
    }

    private run({
        key,
        value
    }: PresentValue): { threw: true; error: unknown } | { threw: false; result: StandardSchemaV1.Result<unknown> } {
        let outcome: SchemaOutcome;
        try {
            outcome = this.schema['~standard'].validate(value);
        } catch (error) {
            return { threw: true, error };
        }
        return { threw: false, result: keyIssues(key, requireSync(key, outcome)) };
    }
}

function requireSync(key: string, outcome: SchemaOutcome): StandardSchemaV1.Result<unknown> {
    if (outcome instanceof Promise) {
        // node crashes on an unhandled rejection
        outcome.catch((reason: unknown) => {
            debugWarn(`schema for ${key} rejected: ${errorMessage(reason)}`);
        });
        throw new EnvaptError(
            EnvaptErrorCodes.InvalidUserDefinedConfig,
            `Schema for "${key}" returned a Promise. envapt requires a synchronous schema. zod also returns a Promise when a transform or refine throws. Set Envapter.debug to 'warn' to log that error.`
        );
    }

    return outcome;
}

function tokenForFallback(fallback: unknown): BuiltInConverter {
    const fallbackType = typeof fallback;
    if (fallbackType === 'number' || fallbackType === 'boolean' || fallbackType === 'bigint') return fallbackType;
    return 'string';
}

export function createField(spec: FieldSpec | undefined, fallback?: unknown): Field {
    if (spec === undefined) return new TokenField(tokenForFallback(fallback), fallback);
    if (Validator.isStandardSchema(spec)) return new SchemaField(spec, fallback);
    if (Validator.isArrayConverter(spec)) return new ArrayField(spec, fallback);
    if (Validator.isBuiltInConverter(spec)) return new TokenField(spec, fallback);
    return new CustomField(spec, fallback);
}
