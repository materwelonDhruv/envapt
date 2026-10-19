// envapt/legacy ships only the decorators, so importing the main entry is what binds FileSource
import 'envapt';
import { Envapt } from 'envapt/legacy';

class Config {
    // `declare` would erase this member and put the decorator on the prototype
    @Envapt('TSC_EMIT_STATIC', { fallback: 1 })
    static readonly staticValue: number;

    @Envapt('TSC_EMIT_INSTANCE', { fallback: 'fallback' })
    declare readonly instanceValue: string;

    // useDefineForClassFields defines an own field here that shadows the prototype getter
    @Envapt('TSC_EMIT_INSTANCE', { fallback: 'fallback' })
    readonly instanceNoDeclare!: string;

    // tsc 6 emits `declare static` against the prototype, so a static read never hits the getter.
    // tsgo emits it against the constructor and the read resolves.
    @Envapt('TSC_EMIT_DECLARE_STATIC', { fallback: 2 })
    declare static readonly declareStaticValue: number;
}

const config = new Config();
process.stdout.write(
    JSON.stringify({
        staticValue: Config.staticValue,
        instanceValue: config.instanceValue,
        instanceNoDeclare: config.instanceNoDeclare,
        declareStaticValue: Config.declareStaticValue
    })
);
