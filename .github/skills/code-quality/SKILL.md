---
name: code-quality
description: Use this when asked to write code, or audit, sweep, or fix code quality in the envapt repo (incl. the apps/guide Fumadocs docs app). Covers React 19 + Tailwind v4 antipattern categories as a manual review checklist, TS/OOP/fail-fast rules, and when to parallelize with subagents. Also use when onboarding any agent to this repo's quality standards.
---

# Code Quality Sweep

> **envapt context (read first).** The body of this file (and parts of REACT19.md / TAILWIND.md) was authored for the *breach* monorepo. In **envapt**:
>
> - **react-doctor and knip are NOT installed.** Treat the react-doctor categories below as a **manual code-review checklist** (they're genuinely good React/Tailwind rules); ignore the `pnpm react-doctor` / `pnpm knip` mechanics and the `knip.json` apps/api examples unless those tools are actually added.
> - **Quality gates are** `pnpm lint:fix` → `pnpm tc` → `pnpm lint:fix:md` → `pnpm test`, and `pnpm prePush` before pushing (turbo dispatches from repo root). `packages/envapt/**` changes need a `changeset`. See `AGENTS.md`.
> - The **React 19 (REACT19.md) + Tailwind v4 (TAILWIND.md)** rules apply to the new **`apps/guide`** docs app (Fumadocs on **Next.js App Router**, so RSC *does* apply — it is **not** a Vite SPA). There is **no shared `@breach/ui`**: brand tokens live in the guide's own `global.css` `@theme`, and `cn()` + UI primitives (e.g. `BaseButton`) live locally inside `apps/guide`.
> - The **"Route conventions" (Hono / OpenAPI)** section below is breach-only and does **not** apply to envapt.

This repo enforces quality through three complementary tools:

| Tool                    | What it catches                                                                                     | Script                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **react-doctor**        | React antipatterns — mutable deps, index keys, deprecated APIs, design shorthands, giant components | `pnpm react-doctor`                          |
| **knip**                | Dead code — unused files, exports, types, deps, devDeps, binaries                                   | `pnpm knip`                                  |
| **ESLint + TypeScript** | Type errors, lint violations, import order, rule violations                                         | `pnpm -C <pkg> lint:fix && pnpm -C <pkg> tc` |

The only acceptable end state is: **react-doctor shows no issues, knip shows no issues (barring false-positives), all packages tc + lint:fix at 0 errors/warnings.**

---

## Running the Tools

```sh
# From repo root
pnpm react-doctor      # runs react-doctor --verbose across all packages
pnpm knip              # runs knip with knip.json config

# Per-package quality gates (run after every change)
pnpm -C <pkg> tc
pnpm -C <pkg> lint:fix
pnpm -C <pkg> test     # if tests exist
```

react-doctor is interactive — it prompts you to select which packages to scan. Select all unless you're doing a targeted fix.

---

## react-doctor Output: Categories and Fixes

### Errors (✗) — bugs, fix immediately

**`no-mutable-in-deps`**
`location.pathname`, `ref.current`, or other mutable globals in a `useEffect` deps array. These don't trigger re-renders when they change, so the effect won't re-run.

```tsx
// Bad
useEffect(() => {
    doSomething();
}, [location.pathname]);

// Good — depend on the stable object, read .pathname inside
useEffect(() => {
    const path = location.pathname;
    doSomething(path);
}, [location]);

// Or: read inside the effect body, no dep at all
useEffect(() => {
    doSomething(window.location.pathname);
}, []);
```

---

### Warnings (⚠) — fix in the same pass

**`design-no-bold-heading`**
`font-bold`, `font-extrabold`, or `font-black` on heading elements (h1–h6). Change to `font-semibold`.

```tsx
// Bad
<h2 className="font-extrabold">Title</h2>

// Good
<h2 className="font-semibold">Title</h2>
```

**`design-no-redundant-size-axes`**
`w-N h-N` when both axes are equal. Collapse to `size-N` (Tailwind v3.4+).

```tsx
// Bad
<div className="w-4 h-4" />

// Good
<div className="size-4" />
```

**`no-react19-deprecated-apis`**
`useContext(X)` is superseded by `use(X)` in React 19+. Also: `forwardRef` is no longer needed.

```tsx
// Bad
import { useContext } from 'react';
const value = useContext(MyContext);

// Good
import { use } from 'react';
const value = use(MyContext);
```

**`prefer-useReducer`**
Component has 5+ `useState` calls for related state. Group the related boolean/open-state flags into a `useReducer`.

```tsx
// Bad — 6 related useState calls
const [isOpen, setIsOpen] = useState(false);
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
// ...

// Good — useReducer for related state group
type UIState = { isOpen: boolean; isDropdownOpen: boolean; };
type UIAction = { type: 'open' } | { type: 'closeAll' };
function uiReducer(state: UIState, action: UIAction): UIState { ... }
const [ui, dispatchUI] = useReducer(uiReducer, { isOpen: false, isDropdownOpen: false });
```

**`no-array-index-as-key`**
Array index used as React key. Causes bugs when the list is reordered or filtered.

```tsx
// Bad
items.map((item, i) => <Item key={i} />);

// Good — use stable identity
items.map((item) => <Item key={item.id} />);

// For static arrays with no ID, use the content itself
STATIC_TABS.map((tab) => <Tab key={tab.label} />);
```

**`js-combine-iterations`**
`.filter().map()` iterates the array twice. Combine into a single `.reduce()` pass.

```ts
// Bad
items.filter(predicate).map(transform);

// Good
items.reduce<Result[]>((acc, item) => {
    if (predicate(item)) acc.push(transform(item));
    return acc;
}, []);
```

**`server-sequential-independent-await`**
Two independent `await` calls in sequence — they can race instead of waterfall.

```ts
// Bad
const a = await fetchA();
const b = await fetchB();

// Good
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

**`async-defer-await`**
`await` appears before a synchronous early-return guard. The guard doesn't need the awaited value, so it runs slower than necessary.

```ts
// Bad
async function handle(input: string | null) {
    const result = await expensiveOperation();
    if (!input) return; // could have returned before the await
    return result;
}

// Good
async function handle(input: string | null) {
    if (!input) return;
    return await expensiveOperation();
}
```

**`rendering-hydration-mismatch-time`**
`new Date()` or `Math.random()` reachable from JSX renders differently on server vs client.

```tsx
// Bad
<p>{new Date().toLocaleDateString()}</p>;

// Good — client-only rendering
const [now, setNow] = useState<Date | null>(null);
useEffect(() => {
    setNow(new Date());
}, []);
<p>{now?.toLocaleDateString() ?? ''}</p>;
```

**`no-barrel-import`**
Importing from a barrel/index file instead of the direct source module. Import from the specific file.

```ts
// Bad
import { useAuthStore } from '../stores';

// Good
import { useAuthStore } from '../stores/useAuthStore';
```

**`no-giant-component`**
Component exceeds ~200 lines. Extract into focused sub-components. The parent should read as an orchestrator — state, effects, and composition of named sub-components. The children should be focused on a single visual concern.

---

## Knip Output: Categories and Fixes

### Genuine dead code — fix

| Category              | Fix                                                                        |
| --------------------- | -------------------------------------------------------------------------- |
| Unused deps/devDeps   | Remove from `package.json`, run `pnpm install --store-dir .pnpm-store/v11` |
| Unused files          | Delete with `git rm`                                                       |
| Unused exports        | Remove the `export` keyword if only used internally; delete if dead code   |
| Unused exported types | Same — remove `export` if internal, delete if unused                       |

### False positives — configure away in `knip.json`

| Pattern                                                   | Why it's a false positive               | Fix                                                                                                 |
| --------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Migration files (`apps/api/src/db/migrations/*.ts`)       | Run by migration runner, not imported   | Add to `entry` in workspace config                                                                  |
| Script files (`apps/api/scripts/*.ts`)                    | Run via `pnpm exec tsx`, not imported   | Add to `entry`                                                                                      |
| Generated files (`api-types.generated.ts`)                | Auto-generated; exports used externally | Add to `ignore`                                                                                     |
| CLI deps used via `pnpm exec` (e.g. `openapi-typescript`) | Not imported, called as binary          | Add to `ignoreDependencies`                                                                         |
| Shell keywords in scripts (e.g. `continue` in bash)       | Not a Node binary                       | Add to `ignoreBinaries`                                                                             |
| Hono route objects — used via `.openapi(route, handler)`  | Knip can't trace Hono's typed router    | Remove the named export (they're internal-only if only the factory function is consumed externally) |
| DB schema documentation interfaces                        | Intentionally exported for reference    | Add the file to `ignore` in workspace config                                                        |

### `knip.json` configuration reference

```json
{
    "$schema": "https://unpkg.com/knip@latest/schema.json",
    "ignoreBinaries": ["<shell-keyword-or-tool>"],
    "workspaces": {
        "apps/api": {
            "entry": ["src/index.ts", "scripts/*.ts", "src/db/migrations/*.ts"],
            "project": ["src/**/*.ts", "scripts/**/*.ts"],
            "ignoreDependencies": ["<cli-dep-used-via-pnpm-exec>"],
            "ignore": ["src/db/database.ts"]
        },
        "packages/shared": {
            "ignore": ["src/api-types.generated.ts"]
        }
    }
}
```

---

## When to Use Subagents

For large sweeps (20+ issues across multiple packages), parallelize:

```
Subagent A → packages/ui + packages/web
Subagent B → apps/admin
Subagent C → apps/shop (usually the largest)
```

Each subagent should:

1. Run react-doctor for its package(s) to get the full current issue list
2. Fix every issue found
3. Run `tc` and `lint:fix` and confirm 0 errors
4. Re-run react-doctor to confirm the issues are gone
5. NOT commit — the orchestrator commits after all subagents complete

For small sweeps (under 10 issues, 1–2 packages), fix inline — subagent overhead isn't worth it.

---

## Dependency Removal Protocol

When knip flags an unused dep, verify before removing:

1. `grep -r "from '<pkg>'" . --include="*.ts" --include="*.tsx" | grep -v node_modules` — confirm no imports
2. `grep -r "require('<pkg>')" .` — check for CJS requires
3. `grep -r "'<pkg>'" package.json --include="*.json"` — check scripts that call it as a CLI binary

If steps 1–2 return nothing and step 3 shows only a package.json entry: **remove it**.

If step 3 shows a script calling it via `pnpm exec <pkg>`: it's a CLI dep. Add to `ignoreDependencies` in knip.json rather than removing.

For deps removed from `package.json`, always update the lock file:

```sh
pnpm install --store-dir .pnpm-store/v11
```

---

## Commit Strategy

Commit after each well-defined phase clears all gates — not all at the end.

Example milestones:

- `fix(<pkg>): react-doctor bugs + warnings` — after a package is clean
- `chore: remove unused deps and dead code` — after knip cleanup
- `chore: add knip.json and quality scripts` — when adding tooling

---

## Route conventions

- New API routes in `apps/api` must use `createOpenAPIHono` from `@utils/openApiHono`. Routes are typed against Zod schemas in `@breach/shared` and surfaced via the generated OpenAPI doc consumed by `@breach/web/api`.
- The only acceptable fallback to plain `Hono` is a raw-body requirement (webhook signature verification), because OpenAPIHono parses bodies before the handler sees them. When this applies, add a comment header to the route file explaining why — see `apps/api/src/routes/webhooks/stripe.ts` for the canonical example.

---

## Related Skills (in this folder)

- **[`PREVENT-REINVENTION.md`](./PREVENT-REINVENTION.md)** — checks to run before writing new code (reuse existing primitives, tokens, utilities)
- **[`TAILWIND.md`](./TAILWIND.md)** — v4 CSS-first setup, cn(), tokens.ts fragments, @theme, opacity modifiers, responsive discipline, v4 gotchas vs v3
- **[`REACT19.md`](./REACT19.md)** — use() vs useContext, ref as prop, useTransition/useActionState/useOptimistic, deprecated APIs, React Compiler
- **[`TYPESCRIPT.md`](./TYPESCRIPT.md)** — type narrowing, discriminated unions, generics, satisfies, const assertions, branded types, utility types
- **[`OOP.md`](./OOP.md)** — class vs function decision, SOLID in TypeScript, service pattern, composition vs inheritance, access modifiers
- **[`FAIL-FAST-RULES.md`](./FAIL-FAST-RULES.md)** — null/undefined handling, invariant checks, when NOT to use `?.` / `??`
