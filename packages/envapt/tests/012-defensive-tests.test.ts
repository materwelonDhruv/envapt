import { afterEach, describe, expect, it } from 'vitest';

import { Converters, Envapter, EnvaptError, FileSource, PortableSource } from '../src';

describe('Defensive tests', () => {
    afterEach(() => {
        Envapter.useSource(new FileSource());
    });

    describe('converter edge inputs', () => {
        it('returns [] when every array item is empty', () => {
            Envapter.useSource(new PortableSource({ ALLOWED_ORIGINS: ' , , ' }));
            expect(Envapter.getAs('ALLOWED_ORIGINS', Converters.array())).to.deep.equal([]);
        });

        it('returns the fallback for a numeric timestamp past the Date range', () => {
            const fallback = new Date(0);
            Envapter.useSource(new PortableSource({ RELEASED_AT: '9'.repeat(400) }));
            expect(Envapter.getAs('RELEASED_AT', Converters.Date, fallback)).to.equal(fallback);
        });

        it('returns the fallback for an ISO date with out-of-range fields', () => {
            const fallback = new Date(0);
            Envapter.useSource(new PortableSource({ RELEASED_AT: '2023-13-40T25:61:61Z' }));
            expect(Envapter.getAs('RELEASED_AT', Converters.Date, fallback)).to.equal(fallback);
        });
    });

    describe('templates', () => {
        it('keeps an unresolved reference when the referenced value is itself unresolved', () => {
            Envapter.useSource(
                new PortableSource({ TEMPLATE_ONE: '${TEMPLATE_TWO}', TEMPLATE_TWO: '${TEMPLATE_THREE}' })
            );
            expect(Envapter.get('TEMPLATE_ONE')).to.equal('${TEMPLATE_TWO}');
        });
    });

    describe('key-input validation', () => {
        it('throws when keys include a non-string entry', () => {
            // @ts-expect-error a non-string key reaches the runtime guard
            expect(() => Envapter.getRaw(['VALID_KEY', 42])).to.throw(EnvaptError, 'Environment keys must be strings.');
        });

        it('throws when keys include an empty string', () => {
            expect(() => Envapter.getRaw(['   '])).to.throw(EnvaptError, 'Environment keys cannot be empty strings.');
        });
    });
});
