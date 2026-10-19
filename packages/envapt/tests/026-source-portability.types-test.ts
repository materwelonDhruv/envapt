import { expectTypeOf } from 'vitest';

import { PortableSource } from '../src';

// like a Cloudflare Env binding, this interface has no index signature
interface CloudflareLikeEnv {
    APP_NAME: string;
    PORT: string;
}

declare const binding: CloudflareLikeEnv;

expectTypeOf(new PortableSource(binding)).toEqualTypeOf<PortableSource>();
