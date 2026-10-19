import { Envapt } from '../../src/legacy';

// at runtime an object fallback with no converter throws FallbackConverterTypeMismatch on read
export class FallbackOnlyObject {
    @Envapt('RETRY_POLICY', { fallback: { retries: 3, backoff: 'exponential' } })
    static readonly retryPolicy: { retries: number; backoff: string };
}
