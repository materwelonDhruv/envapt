---
'envapt': major
---

Unify the rule for when an environment value counts as missing, and use it in every read path, with the global `strict` flag as its only knob.

A value is missing when it is unset or an empty string (always), and additionally when it is whitespace-only under `Envapter.strict = true`. This one rule now applies to ordered-key reads, `getRequired` / `getRequiredAll`, `Envapter.require`, the `@Envapt({ required: true })` decorator, environment detection, and `${VAR}` template resolution, so their behavior stays consistent.

**Breaking changes to APIs that predate v8:**

- Ordered-key reads skip a present-but-empty candidate. `Envapter.get(['PRIMARY', 'FALLBACK'])` returns `FALLBACK` when `PRIMARY` is set but empty. A single key set to an empty string still resolves as before.
- `Envapter.require` and the `@Envapt({ required: true })` decorator keep a whitespace-only value in the default non-strict mode, where they previously treated it as missing.
- Environment detection keeps a whitespace-only key under non-strict and skips it under strict, where it previously used the key in both modes.

Set `Envapter.strict = true` for the old whitespace-is-blank behavior.
