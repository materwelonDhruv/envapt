---
name: code-quality
description: Use this when asked to write code, or audit, sweep, or fix code quality in the envapt repo. Covers TypeScript antipatterns to catch by hand, dead-code checks, decorator-API design rules, and when to parallelize work with subagents. Also use when onboarding any agent to this repo's quality standards.
---

# Code Quality Sweep — envapt

envapt is a single-package pnpm + turbo monorepo (`packages/envapt`). Pure-TypeScript runtime library, no frontend. Quality is enforced through layered checks:

| Layer                          | What it catches                                                         | How to run                                                                         |
| ------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **ESLint + TypeScript** (tool) | Type errors, lint violations, import order, formatting, rule violations | `pnpm lint:fix && pnpm tc` from repo root (turbo runs across the workspace).       |
| **Vitest** (tool)              | Behavior regressions                                                    | `pnpm test` (only after lint + tc pass).                                           |
| **Prettier** (tool)            | Formatting                                                              | `pnpm fmt` / `fmt:check`.                                                          |
| **markdownlint-cli2** (tool)   | Markdown style/syntax issues                                            | `pnpm lint:md` (configured via `.markdownlint.json` + `.markdownlint-cli2.jsonc`). |
| **changesets** (tool)          | Missing version bump on the published package                           | `pnpm cs` when touching `packages/envapt`; `pnpm cs:status` to check.              |
| **Coverage** (tool)            | Test coverage gaps                                                      | `pnpm coverage` — v8 reporter, gated in CI.                                        |

The only acceptable end state for a PR is: **`pnpm prePush` exits clean** — which means `build && tc && lint && lint:md && test` all pass.

---

## Running the gates

```sh
# Always lint:fix (never plain lint).
pnpm lint:fix

# Then typecheck — must pass before running tests.
pnpm tc

# Then markdown if you touched any .md.
pnpm lint:fix:md

# Then tests.
pnpm test

# The full pre-push gate:
pnpm prePush     # build + tc + lint + lint:md + test
```

Husky's `pre-commit` runs `lint-staged` (see `lint-staged.config.mjs`); `pre-push` runs `pnpm prePush`. Don't bypass them with `--no-verify` unless explicitly asked.

---

## TypeScript antipatterns to catch by hand

These apply to all code in `packages/envapt/src`. They're not auto-detected — read for them when you review a diff.

### Bugs — must fix before merge

- **`any` in production code** — use `unknown` then narrow with a type guard. Tests may use pragmatic `as unknown as Test` casts with a justification comment; never `as any`.
- **`as unknown as T` double casts** in production — fix the declaration, write a type guard, or refactor the API.
- **`@ts-ignore` / `@ts-expect-error` without comment** — every suppression needs a one-line justification on the same line.
- **Unused exports** — before adding `export` to a symbol, verify it's consumed outside the file. Unused exports are dead code; remove the `export` keyword.
- **Commented-out code** — delete it. Git history is the archive.
- **Half-finished `// TODO: complete later`** — finish or delete. Never ship.

### Warnings — fix in the same pass

- **Block-bodied exported arrow functions** — convert to function declarations. Arrows are for inline callbacks and short utilities only.
- **Static-only classes used as namespaces** — replace with named exports. The exception: classes that exist for `instanceof` checks or that genuinely model OOP behavior.
- **Three similar lines** — that's fine. **Four** is the threshold to consider extracting. Don't extract too early.
- **`?.` and `??` as error suppression** — only use for genuinely optional branches. If a value is _supposed_ to exist and doesn't, fail fast (see `FAIL-FAST-RULES.md`).
- **Comments that say WHAT** — delete. Comments are for WHY only.
- **Decorator on field with initializer + `useDefineForClassFields: true`** — known footgun (see `experimental-decorators.md`). envapt's pattern uses `declare static readonly` to dodge it; preserve that.

See `TYPESCRIPT.md` for the deeper rules.

---

## Dead-code sweep (manual)

envapt doesn't have `knip` wired up yet (planned post-v5). Until then, manually:

```sh
# Find exports never imported externally
rg "^export " packages/envapt/src/ --type ts | wc -l
# Then spot-check each: rg "from '\.\.?/<file>'" or rg "from 'envapt'"

# Find functions defined but never called
# (Use the ts-language-server's "find references" in your editor — faster.)
```

Run before opening a PR that touches `src/`. If `knip` lands, replace with `pnpm knip`.

---

## When to use subagents

Use Claude Code subagents (`Agent({ subagent_type, ... })`) when:

- **Research is open-ended** — "what does library X do?" / "how do projects Y handle Z?" Use `general-purpose` with `model: sonnet`.
- **Multiple independent investigations** can run in parallel — fan out to 3–5 sonnet agents in one message.
- **The main conversation is at risk of context overflow** — delegate file reads to an agent and ask for a digested report.
- **You need a fresh perspective** — code review, grilling a plan, second opinion.

Do NOT spawn a subagent for:

- A single file read (use `Read`).
- A keyword grep (use `Bash` + `rg`).
- Anything where the answer fits in <500 tokens of tool output.

Always pass `model: "sonnet"` per repo convention (`/Users/dhruv/.claude/projects/-Users-dhruv-Desktop-Coding-envapt/memory/feedback_subagent_model.md`).

---

## Cross-package source paths

envapt has one package today (`packages/envapt`). Rule still applies for the future: **never** wire `paths` or `include` in `tsconfig.json` reaching `../<other-pkg>/src`. Consume via package exports only.

---

## Commit strategy

- **One concept per commit.** A formatting sweep + a feature change + a doc update = three commits.
- **Conventional commits** enforced via commitlint: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `types`, `style`.
- **Don't amend after pushing** unless explicitly asked.
- **Don't use `--no-verify`** to skip hooks. If a hook fails, fix the underlying issue.
- For published-package changes (`packages/envapt/**`), add a changeset: `pnpm cs` → write a one-line summary → commit alongside the change.

---

## Related skills (in this folder)

- **`OOP.md`** — class vs function rules, inheritance, composition, no-static-only-classes.
- **`TYPESCRIPT.md`** — strict-mode rules, `any`/`unknown`/casts, type narrowing, utility types.
- **`FAIL-FAST-RULES.md`** — when NOT to reach for `?.` / `??`; when to throw instead.
- **`PREVENT-REINVENTION.md`** — check existing code before writing new abstractions.
