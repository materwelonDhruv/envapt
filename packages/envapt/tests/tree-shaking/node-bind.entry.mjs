import { Converters, Envapter } from 'envapt';

try {
    Envapter.getRequired('ENVAPT_BUNDLE_PROBE_UNSET', Converters.String);
    globalThis.__envaptCode = 'no throw';
} catch (error) {
    globalThis.__envaptCode = error.code;
}
