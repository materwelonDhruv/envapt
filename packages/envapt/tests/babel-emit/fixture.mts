import { Envapter } from 'envapt';
import { Envapt } from 'envapt/legacy';

// babel rejects a decorated `declare` field
class Vars extends Envapter {
    @Envapt('BABEL_EMIT_STATIC', { fallback: 1 })
    public static readonly staticValue: number;
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
