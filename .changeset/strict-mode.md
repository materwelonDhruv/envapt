---
'envapt': major
---

**Feature:** added global `Envapter.strict` flag, decorator + functional `required: true` option, and `Envapter.require()` for boot-time existence checks.

**`Envapter.strict`** (default `false`). When enabled:

- Whitespace-only values (`KEY="   "`) are treated as missing on read, same as `undefined` / empty.
- Empty / whitespace items in array converters (e.g. `PORTS=80,,443`) throw `EmptyArrayElement` (207) instead of being silently filtered.
- Unresolved `${VAR}` placeholders in `Envapter.resolve\`...\`` and inside cached values throw `MissingEnvValue` (305) instead of being preserved as literal text.
- Toggling the flag refreshes the cache so previously-cached values get re-evaluated under the new rule.

**`@Envapt(key, { required: true })`** decorator option. Throws `MissingEnvValue` on first access if the env value is missing or empty (post-trim). Independent of global `strict`. Mutually exclusive with `fallback`: the per-converter overload unions block the combination at compile time, and the runtime Validator throws `InvalidUserDefinedConfig` (302) for dynamic objects that bypass the type check.

**Functional API options-bag form:**

- `Envapter.getUsing(key, { converter, required: true })` returns the converter's narrowed type (no `| undefined`); throws `MissingEnvValue` on missing/empty.
- `Envapter.getWith(key, { converter, required: true })` same behavior for custom converter functions.
- The positional `(key, converter, fallback?)` form is unchanged.

**`Envapter.require()`** existence-check helper:

- `Envapter.require('DATABASE_URL')` returns the post-template-resolution string; throws `MissingEnvValue` if missing or empty.
- `Envapter.require(['A', 'B', 'C'])` returns `void`; collects every missing key into one error message instead of failing one-at-a-time.
- No converter, no fallback. For typed fail-fast, use the decorator or the functional options-bag form.

**`Envapter.dotenvConfig`** type tightened. The `path` and `processEnv` fields are now compile-time errors with branded explanation messages (they were always rejected at runtime; now the TS error surfaces the reason instead of just "excess property").

**New error codes:**

- `EmptyArrayElement = 207` — strict-mode array empty / whitespace items.
- `MissingEnvValue = 305` — required key absent or empty, `require()` failures, strict-mode unresolved templates.
