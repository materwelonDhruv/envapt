import process from 'node:process';

import { type as ark } from 'arktype';
import { Converters, Envapt } from 'envapt';

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

// tsc emits Stage 3 accessor decorators because this tsconfig turns experimentalDecorators off
class Config {
    @Envapt('S3_PORT', { fallback: 3000 })
    static accessor port: number;

    @Envapt('S3_REGION', { fallback: 'us-east-1' })
    accessor region!: string;

    @Envapt('S3_BIG', { converter: Converters.BigInt, fallback: 0n })
    static accessor big: bigint;

    @Envapt('S3_TAGS', { converter: Converters.array({ of: Converters.String }), fallback: [] })
    static accessor tags: string[];

    @Envapt('S3_MISSING', { fallback: 1234 })
    static accessor fallbackValue: number;

    @Envapt(['S3_ABSENT', 'S3_PORT'], { converter: Converters.Number })
    static accessor multiKey: number | undefined;

    @Envapt('S3_GREETING')
    static accessor greeting: string | undefined;

    @Envapt('S3_PORT', { schema: numberSchema })
    static accessor schemaPort: number | undefined;

    // an arktype type is a callable function carrying `~standard`
    @Envapt('S3_PORT', { schema: ark('string.integer.parse') })
    static accessor arkPort: number | undefined;

    @Envapt('S3_ABSENT', { converter: Converters.Number })
    static accessor noFallback: number | undefined;
}

// a subclass reads the inherited instance accessor
class Base {
    @Envapt('S3_REGION')
    accessor region!: string | undefined;
}
class Sub extends Base {}
const inheritedRegion = new Sub().region;

// Two classes sharing a name must not collide in the cache (the class-identity key).
function makeA(): typeof Config {
    class Local {
        @Envapt('S3_PORT', { fallback: 1 })
        static accessor value: number;
    }
    return Local as unknown as typeof Config;
}
function makeB(): typeof Config {
    class Local {
        @Envapt('S3_MISSING', { fallback: 4321 })
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
        big: String(Config.big),
        tags: Config.tags,
        fallbackValue: Config.fallbackValue,
        multiKey: Config.multiKey,
        greeting: Config.greeting,
        schemaPort: Config.schemaPort,
        arkPort: Config.arkPort,
        noFallback: Config.noFallback,
        inheritedRegion,
        collisionA,
        collisionB,
        readOnlyThrew,
        requiredThrew
    })
);
