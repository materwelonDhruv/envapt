import process from 'node:process';

import { Converters, Envapt, EnvBool, EnvNum, EnvStr, EnvTime, EnvUrl } from 'envapt';

import type { StandardSchemaV1 } from 'envapt';

const numberSchema: StandardSchemaV1<string, number> = {
    '~standard': {
        version: 1,
        vendor: 'test',
        validate: (value: unknown) => {
            const n = Number(value);
            return Number.isNaN(n) ? { issues: [{ message: 'not a number' }] } : { value: n };
        }
    }
};

// Compiled with experimentalDecorators off, so tsc emits TC39 Stage 3 accessor decorators, the path
// real consumers (and Bun running .ts directly) get. It must resolve env values without the
// `declare static` workaround the legacy tsc emit needs.
class Config {
    @EnvNum('S3_PORT', 3000)
    static accessor port: number;

    @EnvStr('S3_REGION', 'us-east-1')
    accessor region!: string;

    @EnvBool('S3_DEBUG', false)
    static accessor debug: boolean;

    @EnvUrl('S3_URL', new URL('http://localhost'))
    static accessor url: URL;

    @EnvTime('S3_TTL', '1s')
    static accessor ttl: number;

    @Envapt('S3_BIG', { converter: Converters.Bigint, fallback: 0n })
    static accessor big: bigint;

    @Envapt('S3_TAGS', { converter: Converters.array({ of: Converters.String }), fallback: [] })
    static accessor tags: string[];

    @EnvNum('S3_MISSING', 1234)
    static accessor fallbackValue: number;

    @EnvNum(['S3_ABSENT', 'S3_PORT'])
    static accessor multiKey: number | null;

    @EnvStr('S3_GREETING')
    static accessor greeting: string | null;

    @Envapt('S3_PORT', { schema: numberSchema })
    static accessor schemaPort: number;

    @EnvNum('S3_ABSENT')
    static accessor noFallback: number | null;
}

// a subclass reads the inherited instance accessor
class Base {
    @EnvStr('S3_REGION')
    accessor region!: string | null;
}
class Sub extends Base {}
const inheritedRegion = new Sub().region;

// Two classes sharing a name must not collide in the cache (the class-identity key).
function makeA(): typeof Config {
    class Local {
        @EnvNum('S3_PORT', 1)
        static accessor value: number;
    }
    return Local as unknown as typeof Config;
}
function makeB(): typeof Config {
    class Local {
        @EnvNum('S3_MISSING', 4321)
        static accessor value: number;
    }
    return Local as unknown as typeof Config;
}
const collisionA = (makeA() as unknown as { value: number }).value;
const collisionB = (makeB() as unknown as { value: number }).value;

let readOnlyThrew = false;
try {
    void Config.port;
    (Config as { port: number }).port = 999;
} catch {
    readOnlyThrew = true;
}

let requiredThrew = false;
class Required {
    @Envapt('S3_ABSENT_REQUIRED', { required: true })
    static accessor token: string;
}
try {
    void Required.token;
} catch {
    requiredThrew = true;
}

process.stdout.write(
    JSON.stringify({
        port: Config.port,
        region: new Config().region,
        debug: Config.debug,
        url: Config.url.href,
        ttl: Config.ttl,
        big: String(Config.big),
        tags: Config.tags,
        fallbackValue: Config.fallbackValue,
        multiKey: Config.multiKey,
        greeting: Config.greeting,
        schemaPort: Config.schemaPort,
        noFallback: Config.noFallback,
        inheritedRegion,
        collisionA,
        collisionB,
        readOnlyThrew,
        requiredThrew
    })
);
