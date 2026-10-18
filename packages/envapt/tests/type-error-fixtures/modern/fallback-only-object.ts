import { Envapt } from '../../../src/decorators/modern';

// at runtime an object fallback with no converter throws FallbackConverterTypeMismatch on read
export class FallbackOnlyObject {
    @Envapt('RETRY_POLICY', { fallback: { retries: 3, backoff: 'exponential' } })
    static accessor retryPolicy: { retries: number; backoff: string };
}
