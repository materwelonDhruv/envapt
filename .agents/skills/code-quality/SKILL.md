---
name: code-quality
description: Use this when asked to write code, or audit, sweep, or fix code quality in the envapt repo, including the apps/guide Fumadocs site. Covers the React 19 / TypeScript antipatterns to catch by hand, the dead-code checks, and deciding when to parallelize work with subagents. Also use when onboarding any agent to this repo's quality standards.
---

# Code Quality Sweep

envapt enforces quality through layered checks. Most are tool-enforced, with one review-enforced check that's hard to automate (cross-package source paths).

<!--prettier-ignore-start-->

| Layer | What it catches | How to run today |
| --- | --- | --- |
| **ESLint + TypeScript** (tool) | Type errors, lint violations, import order, formatting, rule violations | `pnpm lint:fix && pnpm tc` from the repo root (turbo runs both workspaces) |
| **Vitest** (tool) | Behavior regressions | `pnpm test` (only after lint + tc pass) |
| **Prettier** (tool) | Formatting | `pnpm fmt` / `pnpm fmt:check`. The pre-commit hook runs `fmt:check` |
| **changesets** (tool) | Missing version bump for `packages/envapt` | `pnpm cs` for any change to `packages/envapt/**`. `pnpm cs:status` to check |
| **React 19 antipatterns** (tool) | Mutable deps, index keys, deprecated APIs, hydration mismatches, hand-rolled `useContext`, giant components | `pnpm react-doctor` from repo root. Configured via `doctor.config.ts`. Run deliberately, NOT on every `prePush` (it's slow + interactive). |
| **Dead code / unused deps** (tool) | Unused files, exports, types, deps, devDeps, binaries | `pnpm knip` from repo root. Configured via `knip.json`. Run deliberately, NOT on every `prePush`. Triage false positives into `knip.json` `ignoreDependencies` / `ignoreBinaries` / extra `entry` patterns with a comment explaining why. |
| **Cross-package source paths** (review) | `paths` or `include` reaching into another package's `src` | Manual review of every new/changed `tsconfig.json` and `vitest.config.ts`. |

<!--prettier-ignore-end-->

The only acceptable end state for a PR is: **lint:fix and tc exit clean, every test passes, no React 19 antipattern is shipped in `apps/guide`, and any `packages/envapt` change has a `changeset`.**

---

## Running the Gates

```sh
# Always lint:fix (never plain lint).
pnpm lint:fix

# Then typecheck. It must pass before running tests.
pnpm tc

# Then tests.
pnpm test

# One workspace only:
pnpm --filter envapt test
pnpm --filter @envapt/guide tc

# Everything the pre-push hook runs:
pnpm prePush
```

Husky runs `fmt:check` and `lint-staged` on commit, commitlint on the message, and `pnpm prePush` on push. Don't bypass the hooks.

---

## React 19 / Next.js 16 Antipatterns to Catch by Hand

These apply to every component in `apps/guide`. react-doctor catches some of them. Read for the rest when you review a diff.

### Bugs: must fix before merge

**Mutable values in effect deps** `location.pathname`, `ref.current`, or other mutable globals in a `useEffect` deps array. These don't trigger re-renders when they change, so the effect won't re-run.

```tsx
// Bad
useEffect(() => {
    doSomething();
}, [location.pathname]);

// Good: depend on the stable object, read .pathname inside
useEffect(() => {
    const path = location.pathname;
    doSomething(path);
}, [location]);

// Or: read inside the effect body, no dep at all
useEffect(() => {
    doSomething(window.location.pathname);
}, []);
```

**Array index as React key** Index keys break when the list is reordered or filtered.

```tsx
// Bad
items.map((item, i) => <Item key={i} />);

// Good: stable identity
items.map((item) => <Item key={item.id} />);

// Static arrays with no id: use the content itself
STATIC_TABS.map((tab) => <Tab key={tab.label} />);
```

**Hydration mismatches** `new Date()`, `Math.random()`, `window.*`, or any client-only value reached from JSX during SSR. The server renders one value while the client renders another, so hydration throws.

```tsx
// Bad
<p>{new Date().toLocaleDateString()}</p>;

// Good: client-only rendering
const [now, setNow] = useState<Date | null>(null);
useEffect(() => {
    setNow(new Date());
}, []);
<p>{now?.toLocaleDateString() ?? ''}</p>;
```

### Warnings: fix in the same pass

**React 19 deprecated APIs** `useContext(X)` is superseded by `use(X)` in React 19. `forwardRef` is no longer needed. `ref` is a normal prop now.

```tsx
// Bad
import { useContext, forwardRef } from 'react';
const value = useContext(MyContext);

// Good
import { use } from 'react';
const value = use(MyContext);

// Function components take ref as a prop directly
function MyInput({ ref, ...rest }: { ref?: Ref<HTMLInputElement> } & InputHTMLAttributes<HTMLInputElement>) {
    return <input ref={ref} {...rest} />;
}
```

**`useState(propValue)` without sync** If the prop can change externally and the state needs to follow it, add `useEffect(() => setState(prop), [prop])` or remount with a `key` derived from the prop.

**5+ related `useState` calls** Collapse related boolean / open-state flags into a `useReducer`.

```tsx
// Bad: 6 related useState calls
const [isOpen, setIsOpen] = useState(false);
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
// ...

// Good
type UIState = { isOpen: boolean; isDropdownOpen: boolean };
type UIAction = { type: 'open' } | { type: 'closeAll' };
function uiReducer(state: UIState, action: UIAction): UIState {
    /* ... */
}
const [ui, dispatch] = useReducer(uiReducer, { isOpen: false, isDropdownOpen: false });
```

**`.filter().map()` chains** Two passes when one would do. Combine with `.reduce()`.

```ts
// Bad
items.filter(predicate).map(transform);

// Good
items.reduce<Result[]>((acc, item) => {
    if (predicate(item)) acc.push(transform(item));
    return acc;
}, []);
```

**`array.includes()` inside a loop** O(n²) membership. Build a `Set` once outside the loop.

```ts
// Bad
for (const x of items) {
    if (denied.includes(x.id)) continue;
}

// Good
const deniedIds = new Set(denied);
for (const x of items) {
    if (deniedIds.has(x.id)) continue;
}
```

**Sequential independent `await`** Two independent awaits in sequence run as a waterfall. They should race.

```ts
// Bad
const a = await fetchA();
const b = await fetchB();

// Good
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

**`await` before a synchronous early-return guard** The guard doesn't need the awaited value. Return first.

```ts
// Bad
async function handle(input: string | null) {
    const result = await expensiveOperation();
    if (!input) return;
    return result;
}

// Good
async function handle(input: string | null) {
    if (!input) return;
    return await expensiveOperation();
}
```

**`font-bold` on headings (h1 to h6)** Bold weight crushes counter shapes at display sizes. Use `font-semibold` at most.

```tsx
// Bad
<h2 className="font-extrabold">Title</h2>

// Good
<h2 className="font-semibold">Title</h2>
```

**`w-N h-N` when both axes are equal** Tailwind v4 collapses to `size-N`.

```tsx
// Bad
<div className="w-4 h-4" />

// Good
<div className="size-4" />
```

**Barrel imports inside the same app** Importing from a barrel/index when the direct module is one folder away costs unnecessary fan-out for the bundler and HMR.

```ts
// Bad
import { useAuthStore } from '../store';

// Good
import { useAuthStore } from '../store/useAuthStore';
```

**Em dash in JSX text** Use a comma, a colon, or parentheses. The em dash visually crowds inline UI text.

**Giant components (~200+ lines)** Extract focused sub-components. The parent orchestrates state, effects, and composition. Children own a single visual concern.

---

## Dead-Code Sweep

`pnpm knip` covers unused files, exports, and dependencies. Run it after moving or deleting code, then check these by hand:

1. **Unused exports.** Before adding `export` to a symbol, confirm something outside the file imports it. An export that only a test imports is a bug. Move the symbol into the test folder or assert through the public surface.
2. **Docs and generated output.** knip reads code only. Before you delete or rename a public symbol, search `apps/guide/content`, `skills/envapt/SKILL.md`, and both READMEs too.
3. **Workspace catalog duplication.** A dependency used by both workspaces belongs in `pnpm-workspace.yaml` under `catalogs:` and is referenced as `catalog:<name>`. `pnpm check:catalog` checks this.

---

## When to Use Subagents

envapt has two workspaces, `packages/envapt` and `apps/guide`. A sweep large enough to split goes one subagent per workspace. For anything smaller, fix inline, since subagent overhead isn't worth it.

Each subagent should:

1. List the antipatterns / dead-code candidates for its workspace
2. Fix every issue found
3. Run `pnpm lint:fix && pnpm tc && pnpm test`
4. Confirm 0 errors before reporting back
5. Not commit. The orchestrator commits after all subagents complete

---

## Library and Guide Together

The guide depends on `envapt` through `workspace:^` and builds against `packages/envapt/dist`. After a change to the library's public types, rebuild it before you check the guide:

```sh
pnpm --filter envapt build
pnpm --filter @envapt/guide build   # runs twoslash on every code block
```

`tc` alone skips the twoslash blocks. Only the guide build compiles them.

---

## Commit Strategy

Commit after each well-defined phase clears all gates. Don't wait until everything is done at the end. Subjects are one lowercase line with no scope, like `fix: react 19 warnings in the guide`.

Any change to `packages/envapt/**` needs a changeset via `pnpm cs`. Read the `changeset-guidelines` skill first.

---

## Related Skills (in this folder)

- **[`PREVENT-REINVENTION.md`](./PREVENT-REINVENTION.md)** covers checks to run before writing new code (reuse the converters, `infra/` helpers, `types/`, and the guide's `lib/` and `components/`)
- **[`TAILWIND.md`](./TAILWIND.md)** covers Tailwind v4 CSS-first setup, `cn()`, `@theme`, opacity modifiers, responsive discipline, and v4 gotchas vs v3 (applies to `apps/guide`)
- **[`REACT19.md`](./REACT19.md)** covers `use()` vs `useContext`, ref as prop, `useTransition` / `useActionState` / `useOptimistic`, deprecated APIs, and React Compiler
- **[`TYPESCRIPT.md`](./TYPESCRIPT.md)** covers type narrowing, discriminated unions, generics, `satisfies`, const assertions, branded types, and utility types from `type-fest`
- **[`OOP.md`](./OOP.md)** covers class vs function decision, SOLID in TypeScript, service pattern, composition vs inheritance, and access modifiers
- **[`FAIL-FAST-RULES.md`](./FAIL-FAST-RULES.md)** covers null/undefined handling, invariant checks, and when NOT to use `?.` / `??`
