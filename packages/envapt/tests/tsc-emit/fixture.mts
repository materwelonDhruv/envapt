// envapt/legacy ships only the decorators, so importing the main entry is what binds FileSource
import 'envapt';
import { Envapt } from 'envapt/legacy';

class Config {
    // `declare` would erase this member and put the decorator on the prototype
    @Envapt('TSC_EMIT_STATIC', { fallback: 1 })
    static readonly staticValue: number;

    @Envapt('TSC_EMIT_INSTANCE', { fallback: 'fallback' })
    declare readonly instanceValue: string;
}

const config = new Config();
process.stdout.write(
    JSON.stringify({
        staticValue: Config.staticValue,
        instanceValue: config.instanceValue
    })
);
