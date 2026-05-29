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
- **Use `type-fest` utility types** if you need structural transforms beyond what's already in `Types.ts`. envapt's `Types.ts` re-exports project-specific aliases — check there first.
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
- **Run `pnpm prePush`** before pushing — it runs `build && tc && lint && lint:md && test` and is what husky's pre-push hook gates on.
- **For changes to `packages/envapt/**`**, add a `changeset` (`pnpm cs`) so the release pipeline can publish the new version and changelog entry. `pnpm cs:status` shows pending changesets.

---

## Repo Surface (where things live)

- `packages/envapt/src/` — the library source:
    - `index.ts` — public surface
    - `Envapt.ts` — the `@Envapt` decorator + overload tower
    - `Envapter.ts` — public class, adds `resolve` tagged template
    - `Converters.ts` — `Converters` object (scalar tokens + `array` builder) + `ConverterToken` type
    - `ListOfBuiltInConverters.ts` — converter list + runtime typeof checkers
    - `BuiltInConverters.ts` — every built-in converter (string/number/bool/bigint/symbol/json/array/url/regexp/date/time)
    - `Parser.ts` — template `${VAR}` resolution + converter dispatch
    - `Validators.ts` — runtime guards for converters/fallbacks/env-file options
    - `Dotenv.ts` — internal `.env` loader + `EnvFileOptions` type
    - `Debug.ts` — debug logging helpers (`debugWarn`/`debugVerbose`) keyed off `Envapter.debug`
    - `StandardSchema.ts` — inlined Standard Schema V1 interface (sync-only)
    - `Types.ts` — all public + internal types
    - `Error.ts` — `EnvaptError` + `EnvaptErrorCodes` enum
    - `core/` — the mixin chain (`EnvapterBase` → `EnvironmentMethods` → `PrimitiveMethods` → `AdvancedMethods`)
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

envapt uses `experimentalDecorators: true` (see `.vscode/experimental-decorators.md` for the ecosystem audit). The `@Envapt` decorator pattern mutates the prototype via `Object.defineProperty(target, propKey, { get })`. Constraints:

- **Users declare with `declare public/static readonly`** — no field initializer. This dodges the `useDefineForClassFields: true` footgun. Document this prominently in any new decorator example.
- **The classic 3-arg API (`@Envapt('KEY', fb, Converter)`) is deprecated as of v5** and will be removed in v6. New code uses the modern options-object form: `@Envapt('KEY', { converter, fallback })`.
- **Sugar decorators** (`@EnvNum`, `@EnvUrl`, `@EnvTime`, etc.) added in v5 are thin factories that delegate to `createPropertyDecorator`. Keep them minimal — don't add per-type validation logic; that belongs in the converter.

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
pnpm prePush              # build && tc && lint && lint:md && test
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
