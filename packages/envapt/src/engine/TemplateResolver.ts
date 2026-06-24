import { debugWarn } from '../infra/Debug';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

import type { EnvapterService } from '../types/Env';

/**
 * Resolve `${VAR}` template references in environment values, guarding against circular
 * references and missing variables.
 * @internal
 */
export class TemplateResolver {
    private readonly TEMPLATE_REGEX = /\${\w*}/g;

    constructor(private readonly envService: EnvapterService) {}

    resolveTemplate(key: string, value: string, stack: Set<string> = new Set<string>()): string {
        stack.add(key);
        const strict = this.envService.isStrict();

        const out = value.replace(this.TEMPLATE_REGEX, (template) => {
            const variable = template.slice(2, -1);

            if (stack.has(variable)) return template; // cycle, preserve

            const raw = this.envService.getRaw(variable);
            const isMissing = raw === undefined || raw === '' || (strict && raw.trim() === '');
            if (isMissing) {
                if (strict) {
                    throw new EnvaptError(
                        EnvaptErrorCodes.MissingEnvValue,
                        `Cannot resolve template variable "\${${variable}}": value is missing or empty.`
                    );
                }
                debugWarn(`unresolved template \${${variable}} preserved as literal`);
                return template; // missing or empty, preserve
            }

            const resolved = this.resolveTemplate(variable, raw, new Set(stack));

            // If resolution still references the current key, skip replacement (indirect cycle)
            if (resolved.includes(`\${${key}}`)) return template;

            // If nothing changed (unresolved placeholders stayed), also preserve original template
            if (resolved === raw && /\$\{[^}]*\}/.test(resolved)) return template;

            return resolved;
        });

        stack.delete(key);
        return out;
    }
}
