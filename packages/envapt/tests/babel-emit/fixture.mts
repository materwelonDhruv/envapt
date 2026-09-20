import { Converters, Envapter } from 'envapt';
import { Envapt } from 'envapt/legacy';

// babel rejects a decorated `declare` field
export class Vars extends Envapter {
    @Envapt('BABEL_EMIT_STATIC', { fallback: 1 })
    public static readonly staticValue: number;

    @Envapt('BABEL_EMIT_NAME', { fallback: 'fallback' })
    public static readonly name2: string;

    @Envapt('BABEL_EMIT_LIST', { converter: Converters.array(), fallback: [] })
    public static readonly list: string[];
}

process.stdout.write(
    JSON.stringify({
        staticValue: Vars.staticValue,
        assignThrows: ((): boolean => {
            try {
                (Vars as { staticValue: number }).staticValue = 0;
                return false;
            } catch {
                return true;
            }
        })()
    })
);
