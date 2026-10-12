---
name: prevent-reinvention
description: Use this before adding code, config, or components in the envapt repo. Audit the existing surface first, then either reuse what exists or add a clean extension in the right module. Follow these checks unless the user explicitly instructs otherwise.
---

# Prevent Reinvention & Tech-Debt Discipline

envapt has two workspaces. `packages/envapt` is the published library, and `apps/guide` is the Fumadocs site. Every new piece of code is one of two things:

1. **Reuse** of an existing helper, type, guard, converter, or pattern.
2. **A justified, named extension** to that existing surface, added in the right module, then reused.

There is **no third option.** If neither fits, stop and ask the user. Do not invent a local workaround. A second key formatter, a second "is this value missing" check, or a second error class looks small today and drifts from the first one by the next release.

Before writing any new code, run the checks below. If the answer to any is "I haven't checked," go check.

---

## Reuse Checks (run BEFORE writing)

### 1. Does the helper already exist in the library?

Read the module before you write a parallel one:

<!--prettier-ignore-start-->

| You need | It already lives in |
| --- | --- |
| "is this value missing", "was a fallback passed" | `core/missing.ts` (`isMissing`, `hasFallback`) |
| a key or key list resolved to a value | `core/engine.ts` (`resolveKeyInput`) |
| `${VAR}` expansion | `engine/TemplateResolver.ts` |
| a runtime type guard or config check | `engine/Validators.ts` (`Validator`) |
| a string turned into a typed value | `converters/` (`Converters`, `BuiltInConverters`, `ValueConverter`) |
| a Standard Schema run | `ValueConverter.convertWithSchema` |
| an error | `infra/Error.ts` (`EnvaptError` + a code from `EnvaptErrorCodes`) |
| a debug line | `infra/Debug.ts` (`debugWarn`, `debugVerbose`) |
| key casing | `infra/recase.ts` (runtime) and `types/Casing.ts` (`RecaseKey`) |
| an object turned into string vars | `sources/coerce.ts` (`coerceToStringRecord`) |
| a public type alias | `types/` (check the barrel `types/index.ts` first) |

<!--prettier-ignore-end-->

If your helper is "almost" one that already exists but has one different behavior, that is a missing **option or overload**. Extend the existing one.

New reader behavior belongs on the mixin chain in `core/` (`EnvapterBase` → `EnvironmentMethods` → `PrimitiveMethods` → `AdvancedMethods`). Do not build a parallel set of free functions next to it.

### 2. Is the literal value a typed constant?

Any magic number, error message format, env var name, or repeated literal: check `types/` and `infra/` first. If the value isn't there and you're about to use it three times, **add a named constant first, then use it.**

### 3. In the guide, does the primitive already exist?

- `apps/guide/lib` holds `cn`, `site`, `source`, `date`, and the OG and llms helpers.
- `apps/guide/components` holds the primitives (`BaseButton`, `Callout`, `Code`, `CodeCard`, `Section`, `Glyph`) and the page sections.
- `app/global.css` holds the brand tokens.

Use `cn` from `@/lib/cn` for classNames, never `[...].join(' ')`. A one-off style is a missing variant on the primitive. Add the variant.

### 4. Where does this kind of file live?

- Tests live in `packages/envapt/tests/`, numbered, with an `.env.*` fixture. Never `src/**/*.test.ts`.
- Lint and tc cover both `src/**` and `tests/**`.
- ESLint configs are `eslint.config.mjs` per workspace, composed from `@seedcord/eslint-config`.
- TypeScript configs extend the root `tsconfig.json`, which extends `@seedcord/tsconfig`. No `paths` or `include` reaching into another workspace's `src`.
- The library builds with tsdown (`packages/envapt/tsdown.config.ts`) into the `node` and `portable` entries.
- A dependency both workspaces use goes in `pnpm-workspace.yaml` under `catalogs:`. `pnpm check:catalog` enforces it.

### 5. Was this asked for?

If you're tempted to add a tsdown option, a "performance" optimization, a config tweak, a feature flag, a backward-compat shim, or an abstraction that wasn't in the task: **don't.** Surface it as a question first. A silent addition buries the question inside the diff.

### 6. Are you using a new npm package?

Before writing any code that uses a package not already in the workspace, fetch its README for the exact version you'll pin. Never rely on training knowledge. Major bumps routinely move, rename, or deprecate APIs.

1. Check the pinned version in `pnpm-workspace.yaml` or the consuming `package.json`.
2. `curl -s https://registry.npmjs.org/<pkg>/latest` for the latest version and the peer range.
3. Read the README for that version, then write code against what it documents.

### 7. Is a "compatibility issue" actually real?

If you hit a peer-dependency conflict, read the actual peer range upstream and check whether a newer version of the conflicting package widens it. "Compatibility issue" without the range is a guess, and it locks the repo at stale versions.

---

## Anti-patterns to refuse outright

- **A second error type.** Throw `EnvaptError` with a code. A new failure gets a new code and a row in the errors docs page.
- **Converter logic in a decorator.** Sugar decorators stay thin. Conversion and validation belong in the converter.
- **Test files in `src/`.**
- **Unrequested config blocks** added to "improve" build output without measurement or ask.
- **Pinning the same dep twice** when the catalog already has it.
- **`as any`**, and **`as unknown as T`** double casts when a type guard works.
- **Silent fallbacks** (`obj?.x ?? null` returned to a caller that needed the real value).
- **Static-only classes** used as namespaces. `BuiltInConverters` is the one dispatch-table exception.
- **Pre-emptive "for the future"** abstractions. YAGNI.
- **Commenting out** code or tests to get past a failure.

When you catch yourself doing one of these, stop and back up. Reuse what exists, extend it the right way, or ask the user.

---

## Review checklist

1. Did I read the matching module in `src/` (or the guide's `lib/` and `components/`) before writing my helper, type, or primitive?
2. Is every repeated literal a named constant?
3. Are my tests in `packages/envapt/tests/`?
4. Does my code have zero `any`, zero `as unknown as T` doubles, zero silent fallbacks?
5. Did the task ask for every config change in my diff?
6. For every version pin I left alone citing "compatibility," did I cite the upstream peer range?
7. Does a change to `packages/envapt/**` have a changeset?
8. Does `pnpm prePush` exit cleanly?
