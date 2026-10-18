import { describe, expect, it } from 'vitest';

import { BuiltInConverters, Converters } from '../src/converters';
import { Envapter } from '../src/engine/Envapter';
import { TemplateResolver } from '../src/engine/TemplateResolver';
import { EnvaptError, EnvaptErrorCodes } from '../src/infra/Error';

import type { EnvapterService } from '../src/types/Env';

class StubEnvService implements EnvapterService {
    constructor(
        private readonly values: Record<string, string | undefined>,
        private readonly strict = false
    ) {}

    getRaw(key: string): string | undefined {
        return this.values[key];
    }

    get(key: string): string | undefined {
        return this.values[key];
    }

    isStrict(): boolean {
        return this.strict;
    }
}

const createMatchResult = (...parts: (string | undefined)[]): RegExpMatchArray => {
    const result = parts as unknown as RegExpMatchArray;
    result.index = 0;
    result.input = '';
    return result;
};

const createWeirdString = (...parts: (string | undefined)[]): string =>
    ({
        match: () => createMatchResult(...parts)
    }) as unknown as string;

describe('Defensive tests', () => {
    describe('BuiltInConverters defensive fallbacks', () => {
        it('returns [] when items all collapse to empty after filtering', () => {
            const result = BuiltInConverters.processArrayConverter(' , , ', Converters.array({ delimiter: ',' }));
            expect(result).to.deep.equal([]);
        });

        it('returns fallback for invalid numeric timestamp strings', () => {
            const fallback = new Date(0);
            const invalidTimestamp = '9'.repeat(400);
            expect(BuiltInConverters.date(invalidTimestamp, fallback)).to.equal(fallback);
        });

        it('returns fallback for invalid ISO date strings', () => {
            const fallback = new Date(0);
            const invalidIso = '2023-13-40T25:61:61Z';
            expect(BuiltInConverters.date(invalidIso, fallback)).to.equal(fallback);
        });

        it('returns fallback when regex match misses numeric group in time converter', () => {
            const fallback = 9999;
            const weirdInput = createWeirdString('broken', undefined, 'ms');
            expect(BuiltInConverters.time(weirdInput, fallback)).to.equal(fallback);
        });

        it('returns fallback when numeric group cannot be parsed in time converter', () => {
            const fallback = 8888;
            const weirdInput = createWeirdString('broken', 'not-a-number', 's');
            expect(BuiltInConverters.time(weirdInput, fallback)).to.equal(fallback);
        });
    });

    describe('Converter and template-resolver defensive code paths', () => {
        it('preserves unresolved templates when nested resolution produces placeholders', () => {
            const resolver = new TemplateResolver(
                new StubEnvService({
                    TEMPLATE_ONE: '${TEMPLATE_TWO}',
                    TEMPLATE_TWO: '${TEMPLATE_THREE}'
                })
            );

            const resolved = resolver.resolveTemplate('TEMPLATE_ONE', '${TEMPLATE_TWO}');
            expect(resolved).to.equal('${TEMPLATE_TWO}');
        });
    });

    describe('key-input validation through the public read path', () => {
        it('throws when no keys are provided', () => {
            // @ts-expect-error Runtime guard ensures empty arrays are rejected
            expect(() => Envapter.getRaw([]))
                .to.throw(EnvaptError, 'At least one environment key must be provided.')
                .and.to.have.property('code', EnvaptErrorCodes.InvalidKeyInput);
        });

        it('throws when keys include a non-string entry', () => {
            // @ts-expect-error Passing non-string key to trigger runtime guard
            expect(() => Envapter.getRaw(['VALID_KEY', 42])).to.throw(EnvaptError, 'Environment keys must be strings.');
        });

        it('throws when keys include an empty string', () => {
            expect(() => Envapter.getRaw(['   '])).to.throw(EnvaptError, 'Environment keys cannot be empty strings.');
        });
    });
});
