import { isMissing } from '../core/missing';
import { state } from '../core/state';
import { debugWarn } from '../infra/Debug';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

export class TemplateResolver {
    private readonly TEMPLATE_REGEX = /\${\w+}/g;

    constructor(private readonly getRaw: (key: string) => string | undefined) {}

    resolveTemplate(key: string, value: string, stack: Set<string> = new Set<string>()): string {
        stack.add(key);
        const strict = state.strict;

        const out = value.replace(this.TEMPLATE_REGEX, (template) => {
            const variable = template.slice(2, -1);

            if (stack.has(variable)) return template; // a cycle keeps the placeholder

            const raw = this.getRaw(variable);
            if (raw === undefined || isMissing(raw)) {
                if (strict) {
                    throw new EnvaptError(
                        EnvaptErrorCodes.MissingEnvValue,
                        `Cannot resolve template variable "\${${variable}}": value is missing or empty.`
                    );
                }
                debugWarn(`unresolved template \${${variable}} preserved as literal`);
                return template;
            }

            const resolved = this.resolveTemplate(variable, raw, new Set(stack));

            // indirect cycle
            if (resolved.includes(`\${${key}}`)) return template;

            // the nested value still has unresolved placeholders
            if (resolved === raw && resolved.search(this.TEMPLATE_REGEX) !== -1) return template;

            return resolved;
        });

        stack.delete(key);
        return out;
    }
}
