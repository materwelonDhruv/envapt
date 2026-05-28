---
'envapt': major
---

Add global `Envapter.strict` flag, `required: true` option, and `Envapter.require()` for boot-time existence checks.

- New `Envapter.strict` flag (default `false`). When enabled: whitespace-only values are treated as missing on read; empty / whitespace items in array converters throw `EmptyArrayElement (207)` instead of being silently filtered; unresolved `${VAR}` placeholders in cached values and `Envapter.resolve` tagged templates throw `MissingEnvValue (305)` instead of being preserved as literal text. Toggling the flag refreshes the cache.
- New `@Envapt(key, { required: true })` decorator option. Throws `MissingEnvValue` on first access if the env value is missing or empty (post-trim). Independent of global `strict`. Mutually exclusive with `fallback`: combining them fails to match any overload at compile time, and the runtime Validator throws `InvalidUserDefinedConfig (302)` for dynamic objects that bypass the types.
- New functional options-bag form: `Envapter.getUsing(key, { converter, required: true })` and `Envapter.getWith(key, { converter, required: true })` return the converter's narrowed type (no `| undefined`) and throw `MissingEnvValue` on missing/empty. Positional `(key, converter, fallback?)` form unchanged.
- New `Envapter.require(...keys)` existence-check helper. Variadic rest signature, always returns `void`. At least one key required (compile-time error via `[string, ...string[]]` tuple if zero args). Collects every missing key into a single error instead of failing one at a time. Resolves templates before checking.
- `Envapter.dotenvConfig` type tightened: `path` and `processEnv` are now compile-time errors with branded explanation literals (runtime rejection was already there; the TS error now surfaces the reason instead of "excess property").
- New error codes: `EmptyArrayElement (207)` for strict-mode array empties; `MissingEnvValue (305)` for required-key absences, `require()` failures, and strict-mode unresolved templates.
