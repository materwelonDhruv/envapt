import { EnvNum, EnvStr } from 'envapt';

class Config {
    // tsc emits a real static member here, so the decorator lands on the constructor where the static
    // read finds the getter (`declare` would erase the member and strand the decorator on the prototype).
    @EnvNum('TSC_EMIT_STATIC', 1)
    static readonly staticValue: number;

    @EnvStr('TSC_EMIT_INSTANCE', 'fallback')
    declare readonly instanceValue: string;

    // Instance fields need `declare`. Without it, useDefineForClassFields defines an own field that
    // shadows the prototype getter, so the read is undefined (the `!` only silences strict init).
    @EnvStr('TSC_EMIT_INSTANCE', 'fallback')
    readonly instanceNoDeclare!: string;

    // tsc emits `declare static` against the prototype, so a static read never hits the getter.
    @EnvNum('TSC_EMIT_DECLARE_STATIC', 2)
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
