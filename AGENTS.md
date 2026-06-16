# Envapt Agent Guidelines

Breaking changes are accepted at major-version boundaries. Add a `changeset` for every change to `packages/envapt/**`.

---

## Repository Policy

**Zero Technical Debt.** No workarounds, hacks, or temporary compatibility layers. Choose the cleanest architecture; break things if needed to get it right.

**Scope discipline.** Only implement what was explicitly asked. Surface additions as a question before implementing — never silently add config tweaks, optimizations, feature flags, or abstractions not in the task description.

**No dead code.** No commented-out code, half-finished `// TODO: complete later` implementations, or unused exports. Before adding `export` to a symbol, verify it is consumed outside the file. If it isn't, drop the `export`. If nothing uses it, delete it.

**Do not edit `AGENTS.md`, `CLAUDE.md` (symlink), or any file in `.changeset/` without explicit permission.**

**Respect `Note for Agent:` comments.** The user may add these mid-flight as deliberately-failing type errors or lint errors so they surface when you run checks. Read and honor them before continuing; remove the comment when done.

```ts
// This will cause a lint error
('Note for Agent: switch to the new effects API');

type NoteForAgentAddedByTheUser = 'switch to the new effects API';
const x: NoteForAgentAddedByTheUser = 42; // forces a type error
```

---

## Design Patterns

- **OOP for complex domain logic** (inheritance & composition). **Plain functions for small, stateless utilities.** envapt's public surface leans on classes (`Envapter` and the mixin chain in `core/`); extend or compose those rather than re-implementing parallel function pipelines.

```ts
// Bad
export function getNumber() {}
export function getBoolean() {}

// Good — already the pattern in `core/PrimitiveMethods.ts`
export class PrimitiveMethods extends EnvironmentMethods {
    static getNumber() {}
    static getBoolean() {}
}
```

- **No static-only classes as namespaces.** Use named exports instead. The exception in envapt is `BuiltInConverters` which is a dispatch-table helper — that's a real OOP shape for the lookup pattern, not a namespace.

```ts
// Bad
export class Utils {
    static foo() {}
}

// Good
export function foo() {}
```

- **Function declarations for complex exported functions.** Arrow expressions for inline callbacks and short utilities only — no block-bodied exported arrows.

```ts
// Bad
export const compute = () => {
    /* large */
};

// Good
export function compute() {
    /* large */
}
```

- **DRY and SOLID.** No premature abstractions — three similar lines is better than a wrong abstraction. Wait for the fourth use before extracting.

- **YAGNI.** Don't add features, config, abstractions, or infrastructure for hypothetical future requirements. Ship what the task requires; surface everything else as a question first.

- **No premature optimization.** envapt is config-loading code — not hot-path. Readable, correct first. Profile before optimizing.

- **Split large files** (~200+ lines or multiple unrelated responsibilities) into focused modules. The `core/` mixin chain (`EnvapterBase` → `EnvironmentMethods` → `PrimitiveMethods` → `AdvancedMethods` → `Envapter`) is the canonical example — each file has one responsibility.

---

## Type Standards

- **No `any` in production code.** Use `unknown` then narrow with a type guard. If a third-party library forces a cast, prefer a single `as Expected` with `// justified: <reason>`.
- **No `as unknown as T` double casts.** Fix the declaration, write a type guard, or refactor the API.
- **Don't cast values that are already correctly typed** — adjust the type instead.
- **Prefer `?.` and `??`** for genuinely optional branches — not to suppress errors or hide broken assumptions. See `.github/skills/code-quality/FAIL-FAST-RULES.md` for when NOT to reach for them.
- **Prefer `import type { T } from 'pkg'`** for type-only imports. Avoid inline `import('pkg').T`.
- **Use `type-fest` utility types** if you need structural transforms beyond what's already in `types/`. envapt's `types/` modules re-export project-specific aliases — check there first.
- **Tests may use pragmatic fixture casts** (`as unknown as Test`) — always include a short justification comment. Tests must not use `as any`.
- **To disable an ESLint rule inline:** `// eslint-disable-next-line <rule> -- <reason>`. Never file-wide or project-wide.

```ts
// Bad
let v: any;
const a = (obj as any).x ?? 'd';
const v = x as unknown as T;

// Good
let v: unknown; // then narrow with a type guard
const a = obj?.x ?? 'd';
if (isT(x)) {
    const v = x;
}
import type { Foo } from 'pkg'; // not import('pkg').Foo
```

---

## Imports & Dependencies

- **No cross-package source paths.** envapt has one publishable package today, but if a second one is ever added: no `paths` or `include` reaching `../../packages/x/src`. Consume via package exports only — the `exports` map in each package's `package.json` is authoritative.
- **Use path aliases** if any get added; otherwise relative imports are fine for this codebase size.
- **Add deps with `pnpm add --filter envapt`.** Inspect type declarations before relying on them.
- **Check upstream peer-dep ranges** before citing compatibility blockers — `curl -s https://registry.npmjs.org/<pkg>/latest`, look at the actual peer range, and check whether a newer version of the conflicting package widens it before pinning or skipping a bump.
- **Inspect type declarations for third-party packages** before relying on them. Major version bumps routinely move, rename, or deprecate APIs. Fetch the package's README or `gh api repos/<owner>/<name>/releases/latest` when in doubt — don't rely on training knowledge for fast-moving packages.

---

## Workflow

- **Run from repo root:** `pnpm <script>` — turbo handles the workspace dispatch.
- **Filtered runs:** `pnpm --filter envapt <script>` when you need package-scoped behavior.
- **Execute scripts** with `pnpm exec tsx file.ts` (tsx is installed at the workspace root).
- **Move/rename files** with `git mv` to preserve history.
- **Find usages** with `rg` or `grep` before modifying or removing anything.
- **Verify paths** with `pwd` and `ls` when hitting "No such file or directory."
- **Use package `scripts`** for common tasks; add and document new scripts when needed.
- **Prefer changing file extension to `.txt`** to preserve files marked for deletion (preserves git history).
- **Run `pnpm prePush`** before pushing. It runs `tc && lint && lint:md && test`, the full build runs in CI rather than the hook. This is what husky's pre-push hook gates on.
- **For changes to `packages/envapt/**`**, add a `changeset` (`pnpm cs`) so the release pipeline can publish the new version and changelog entry. `pnpm cs:status` shows pending changesets.

---

## Repo Surface (where things live)

- `packages/envapt/src/` — the library source:
    - `index.ts` — public surface (barrel)
    - `config.ts` — side-effect entry (`import 'envapt/config'`): mirrors the loaded cascade into `process.env`
    - `Envapter.ts` — public class, adds `resolve` tagged template
    - `TemplateResolver.ts` — template `${VAR}` resolution (circular-reference + missing-variable handling)
    - `Validators.ts` — runtime guards for converters/fallbacks/env-file options
    - `Dotenv.ts` — internal `.env` loader + `EnvFileOptions` type
    - `Debug.ts` — debug logging helpers (`debugWarn`/`debugVerbose`) keyed off `Envapter.debug`
    - `StandardSchema.ts` — inlined Standard Schema V1 interface (sync-only)
    - `Error.ts` — `EnvaptError` + `EnvaptErrorCodes` enum
    - `converters/` — converter subsystem (barrel `index.ts`): `Converters` (scalar tokens + `array` builder + `ConverterToken`), `BuiltInConverters` (every built-in: string/number/bool/bigint/symbol/json/array/url/regexp/date/time), `ListOfBuiltInConverters` (converter list + runtime typeof checkers), `ValueConverter` (converter + Standard Schema dispatch)
    - `decorators/` — decorator surface (barrel `index.ts`): `Envapt` (`@Envapt` + overload tower), `SugarDecorators` (`@EnvNum`/`@EnvStr`/`@EnvBool`/`@EnvUrl`/`@EnvTime`), `createPropertyDecorator` (shared getter-install factory)
    - `core/` — the mixin chain (barrel `index.ts`): `EnvapterBase` → `EnvironmentMethods` → `PrimitiveMethods` → `AdvancedMethods`
    - `types/` — all public + internal types (barrel `index.ts`): `Conversion` (converter type system), `Schema` (Standard Schema brand + guards), `Options` (`@Envapt` options + profile config), `Env` (`EnvKeyInput` + internal `EnvapterService` contract)
- `packages/envapt/tests/` — vitest tests, numbered `001-`–`025-`, each paired with a fixture `.env.*` file.
- `scripts/` — `bump-jsr.ts`, `release-metadata.ts` (the JSR sync + release-metadata helpers used by the publish workflow).
- `.changeset/` — pending changesets. Don't edit by hand.
- `.github/workflows/` — CI. `checks.yml` (lint + tc + test + coverage), `publish.yml` (npm + JSR on push to main), `commitlint.yml`, `cleanup-cache.yml`, etc.
- `.github/actions/` — custom composite actions (`turbo-cache`, `release-metadata`, `sync-deno`, `deno-publish-all`).
- `.github/skills/` — agent skill library. `code-quality/` (the canonical entry point), `grill-me/`, `cs-prerelease/`. `.claude/skills` symlinks to `../.github/skills`.
- `.vscode/` — **whitelisted in `.gitignore`** — only the four standard editor configs (`extensions.json`, `launch.json`, `settings.json`, `tasks.json`) are tracked. Everything else (planning docs, audits, scratch) lives in a **private inner git repo at `.vscode/.git`** and never gets pushed to GitHub.

---

## Tests

- **Tests live in `packages/envapt/tests/`** mirroring the public surface — not in `src/**/*.test.ts`. The lint/tc scripts already cover `tests/**`.
- **Vitest** is the runner; `pnpm test` runs once, `pnpm --filter envapt test:watch` watches, `pnpm coverage` reports.
- **Never run tests before lint:fix and tc pass cleanly** — that includes the test files themselves.
- **Tests may use pragmatic fixture casts** (`as unknown as Test`) with a short justification comment. **No `as any`** even in tests.
- **Don't comment out failing tests** to make a build pass. Fix the root cause.
- **Cross-runtime tests (Node/Bun/Deno) are planned for v5** under `packages/envapt/tests/integration/` using `node:assert` (works in all three runtimes). Not in place yet.

---

## Decorator API conventions

The default decorators (`@Envapt` and the sugar decorators on `envapt`) are modern TC39 Stage 3 accessor decorators. They use `experimentalDecorators: false` (the default) and are installed through `decorators/modern/createAccessorDecorator`, which returns a `ClassAccessorDecoratorResult` with a resolving `get` and a throwing `set`. The legacy decorators move to the `envapt/legacy` subpath.

- **Declare modern fields with the `accessor` keyword.** Static fields use `static accessor x: T`, instance fields use `accessor x!: T` with the definite-assignment `!`, no `readonly`, no `declare`, no initializer. Document this in any new modern decorator example.
- **Legacy decorators (`envapt/legacy`) need `experimentalDecorators: true`** and keep the property-decorator form, installed through `decorators/legacy/createPropertyDecorator` with `Object.defineProperty`. Static fields use a plain `static readonly x: T`, instance fields use `declare readonly x: T`, both with no initializer. A `declare static` field reads `undefined` under tsc (the decorator lands on the prototype, off the static read path), and a plain instance field is clobbered by the `useDefineForClassFields` constructor assignment.
- **Both forms typecheck the decorated field against the converter output.** A field that cannot hold the value fails to compile with `[envapt] field type must hold the converter output` (the branded types in `types/Decorator.ts`). A decorated property is read-only, assigning to it throws `EnvaptError`.
- **The positional 3-arg API (`@Envapt('KEY', fb, Converter)`) was removed in v6.** Use the options-object form, `@Envapt('KEY', { converter, fallback })`.
- **Sugar decorators** (`@EnvNum`, `@EnvUrl`, `@EnvTime`, etc.) are thin factories, the modern ones delegate to `createAccessorDecorator` and the legacy ones to `createPropertyDecorator`. Keep them minimal, no per-type validation logic, that belongs in the converter.

---

## Quality Gates

Run after every change, in order:

```sh
pnpm lint:fix             # always lint:fix, never plain lint
pnpm tc
pnpm lint:fix:md          # if you touched any .md
pnpm test
```

Before pushing:

```sh
pnpm prePush              # tc && lint && lint:md && test
```

**The only acceptable outcomes:**

- `lint:fix` → 0 errors, 0 warnings
- `tc` → 0 errors
- `lint:md` → 0 errors
- `test` → 100% passing
- `prePush` → exit 0

**Do not:**

- Comment out tests or code to fix failures — fix the root cause.
- Skip tests because they're complex — write whatever mocks or helpers you need.
- Weaken assertions or add broad `eslint-disable` to bypass failures.
- Skip hooks (`--no-verify`, `--no-gpg-sign`) unless the user explicitly asked.

If auto-fixes occur while you edit, re-run lint/tc/tests locally to confirm the final state before opening a PR.

---

## Subagents

When delegating to subagents via the `Agent` tool: **always pass `model: "sonnet"`**. This is a user-set repo convention. See the agent-tool documentation in your harness; the memory record at `~/.claude/projects/-Users-dhruv-Desktop-Coding-envapt/memory/feedback_subagent_model.md` is authoritative.

Use subagents for:

- Open-ended research (`general-purpose`)
- Multi-agent parallel investigation (fan out 3–5 in one message)
- Independent reviews (`code-reviewer` or `general-purpose` with a focused brief)
- Tasks that would otherwise overflow the main conversation context

Do NOT use subagents for tasks where the answer fits in <500 tokens of tool output or that require fewer than 3 file reads.

---

## Response Format

At the end of the final response, include a concise summary of which files changed, what was done in each, and why.
