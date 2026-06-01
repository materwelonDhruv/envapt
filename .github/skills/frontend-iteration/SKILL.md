---
name: frontend-iteration
description: Use when building or refactoring user-facing UI components. Encodes the dev-page checkpoint loop, mock-fidelity discipline, and animation principles. Each component lands through a structured build → preview → end-turn → user-feedback → iterate cycle, NOT a single shot.
---

# Frontend Iteration

A protocol for building UI that actually feels right. The core insight: **the agent cannot judge visual quality**. A page that compiles and matches the spec by description still looks wrong in ways the agent cannot detect from code. The user has to look at it, in the browser, and react.

This skill defines the loop that gives the user a chance to do that, one component at a time.

## The loop

Every user-facing component (or material refactor of one) goes through:

0. **Primitive scan FIRST** — see "Primitive-first checklist" below. Do this before writing a single line of component code. Skipping this is the #1 way agents end up reinventing `Button` / `Select` / `Tabs` / `Modal` / `Drawer` etc. and producing churn that has to be ripped out later.
1. **Build** the component with realistic props, using primitives wherever they fit.
2. **Mount** it on a dev-only preview page with multiple states/variants visible side by side.
3. **Write** one specific, answerable question to a scratch file with the dev URL and a mock/spec reference.
4. **End your turn.** No further tool calls. The pause is the point.
5. **User reloads** the dev page, edits the scratch file with feedback, replies "continue".
6. **You re-read** the scratch file, iterate, update with a new question, end turn.
7. **Loop** until the user writes `approved` or `ship it` inside the file.
8. **Reset** the scratch file to its blank template and move to the next component.

If you batch multiple iterations into one turn without checkpoints, you are doing it wrong. The structural pause is what makes the loop work.

## Primitive-first checklist (Step 0 — mandatory)

**Before writing any UI element**, read the relevant app's primitive index (e.g. `apps/docs/src/components/ui/` — the seedcord apps don't have a shared `@seedcord/ui` package, each app owns its own primitives today) and resolve every HTML form/interactive element you'd otherwise write raw against an existing primitive. This is not optional and not just for new code — it also applies when you're refactoring a component you didn't author. The pattern below is what to apply (some primitives may not exist yet in a given app — when they don't, that's a signal to lift the pattern into a real primitive rather than inline it):

| If you're about to write… | Check the primitive… | Default expectation |
|---|---|---|
| `<button>` | `Button` | **Use it.** Raw `<button>` is only justified for: custom listbox disclosure (`role="option"` rows), layout-id motion contracts where the primitive's child wrapping breaks the animation, invisible modal scrim click-targets, or whole-card-as-button surfaces with bespoke padding. **Inline-justify every raw `<button>` with `// justified: <reason>` so the next audit doesn't re-flag it.** |
| `<input>`, `<input type="…">` | `Input` | Use it. Raw inputs are justified only when the primitive cannot accommodate a documented mock pattern (e.g. left-side absolutely-positioned icon that needs sibling positioning). |
| `<select>` | `Select` | Use it. The primitive should bake in `appearance-none` plus a chevron icon — if it doesn't, fix the primitive (don't roll a chevron in every caller). |
| `<textarea>` | `Textarea` | Use it. |
| Tab list with `role="tab"`/`role="tablist"` | `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` | Use it. If you find yourself writing `<div role="tablist">` with hand-rolled active styles, **stop** — this is one of the most common silent violations. |
| Modal / dialog | `Modal` | Use it. |
| Drawer / sheet | `Drawer` | Use it. |
| Toggle / on-off | `Toggle` | Use it. A `<Checkbox>` styled like a switch is wrong. |
| Card surface | `Card` | Use it. Hand-rolled `rounded-xl border bg-white shadow-*` is a silent violation. |

When a primitive's API doesn't quite fit (e.g. you need a smaller field size, or you need to override outer width), **extend the primitive** — add a token / variant / prop in the shared package — don't write a one-off in the caller. "A 'one-off style' is a missing variant in the design tokens, not an excuse to inline styles."

When in doubt, run this scan before declaring a component done:

```sh
# From repo root. Adjust paths for your project.
rg --line-number '<button|<input|<select|<textarea|role="tab(list)?"' apps/<area>/src | rg -v node_modules
```

Walk the results. Each hit must either resolve to a primitive or carry an inline `// justified:` comment. No silent raw HTML when the primitive exists.

This step applies on every checkpoint, not just the first one. Components built earlier in a phase often need a follow-up sweep once you discover the primitive gap mid-phase.

## Setup (one-time per project)

A new project needs:

- **A dev playground route**, hard-gated behind `import.meta.env.DEV` (or your framework's equivalent) and redirected to `/` in production. Typically `/dev/components`.
- **A grouped index** at that route listing one card per component, linking to per-component preview pages.
- **One file per component** under `src/pages/dev/<Component>Page.tsx` (or your framework's convention). Each page imports the component and renders 2–4 realistic variants with `id` anchors.
- **A shared shell** with title + description + "← back to index" link, so per-component pages stay focused on the previews.
- **An ESLint ignore** for the dev folder so scratch JSX inside previews doesn't fight lint pressure.
- **A scratch file** at a stable path (e.g. `scratch/ui-feedback.md` or `.vscode/scratch/ui-feedback.md`) — checked into git so its protocol header survives, but the body is overwritten every iteration.

If the project already has these, use them. Don't relocate or rename — match what's there.

## The scratch file format

Header (preserved across iterations):

```markdown
# UI Feedback — interactive component iteration

> Protocol: agent updates this file with one component at a time, then ends its turn.
> User edits the file with feedback and replies "continue". Loop until "approved" or "ship it".
>
> Dev URL: <http://localhost:PORT/dev/components>
> Mocks: (path to your visual ground-truth files, if any)

---
```

Body (overwritten each iteration):

```markdown
## Component: <name>

**Mock reference:** <path/file.ext:line-range, if applicable>
**Live URL:** <http://localhost:PORT/dev/components/component-slug>
**Implementation:** <path/to/Component.tsx>

**What's new this iteration:** (only after the first turn)

- one-line summary of each change
- include the WHY when the choice is non-obvious

**Agent's question for you:**

ONE specific question that references file:line in a mock or spec. Vague "does this look right?" questions waste the loop. Good questions:

- "Compare the docs sidebar entries to the design at <path/to/mock:line> — are the corner radii, label sizing, and value font weight matching?"
- "The active pill glides 400ms with bounce 0.15 — comfortable, or do you want it snappier (250ms) / no bounce?"

If a previous iteration revealed a scoping question, flag it here as a separate note.

---

**Your feedback (overwrite this section):**

<paste-screenshot-or-write-text-here>
```

## What makes a good preview page

Show the component in **the states that look different**, not every possible state:

- Default + the canonical screen pattern (e.g. for a button: the product-form action row from the mock, not just three buttons in a row).
- Edge cases that have bitten you before: long text wrap, no-data / empty state, loading state, the state-change transition.
- One controlled instance if the component has interactive behavior worth feeling (active toggles, expand/collapse, hover-driven motion).

Keep each preview wrapped in a `<section>` with a stable `id` anchor so the scratch file can link to a specific block.

## Working from mocks vs. working from specs

If the project has visual mocks (Figma exports, `mocks/*.jsx` files, screenshots in PRs), **the mock is ground truth**. Every visible difference between mock and implementation is a bug unless explicitly descoped. Compare side-by-side before declaring a checkpoint ready.

If there's no mock and the question is "design something good," see the [emil-design-eng](../emil-design-eng/SKILL.md) skill if available, or these defaults:

- Tokens over arbitrary values. If a token doesn't exist for what you need, add it; don't inline the magic number.
- Animations only on `transform` and `opacity`, never on `width`/`height`/`margin`/`top`/`left`. Width on a container that drives sibling layout is the rare exception.
- Custom strong easing curves, not the CSS defaults. `cubic-bezier(0.23, 1, 0.32, 1)` for `ease-out`, `cubic-bezier(0.77, 0, 0.175, 1)` for `ease-in-out`.
- UI animations under 300ms. Hover/tooltip 125–200ms, dropdowns 150–250ms, modals 200–300ms.
- `:active { transform: scale(0.97) }` on every pressable element, with a 120–160ms transition.
- Reduced-motion respected via `useReducedMotion()` (or framework equivalent) on transform-based animations; keep opacity/color animations even in reduced mode.

## Common traps

- **Snapping when it should be smooth.** If a layout shift happens during the animation window (e.g., labels unmounting mid-collapse), the layout reflow snaps. Either sync the unmount with the size animation's end, or use a fixed-width column so positions never move and only opacity changes.
- **Measurement timing.** When CSS and a JS animation library both animate the same property, the library measures positions against the in-flight CSS values and lands them wrong. Pick one owner per property — let CSS handle width OR let motion drive it, not both.
- **Asymmetry between collapse and expand.** If one direction feels different from the other, you likely have a sequencing assumption baked into only one. Trace the order of state changes / mounts / unmounts in each direction.
- **Subpixel jitter** from flex redistribution as a container resizes. `layout="position"` on the affected element smooths this without changing the visible position.
- **Nested routers** are forbidden in React Router v6+. If a preview needs a different routing context, accept a prop (e.g. `pathname?: string`) rather than wrapping in a second router.
- **Gated routes** in previews. If your auth or feature gates intercept the routes your nav points at, the user clicking around the preview gets bounced. Add a controlled mode (`onSelect?: (path: string) => void` rendering buttons instead of links) so previews can be interacted with without leaving the dev page.

## Picking commit boundaries

The loop produces N iterations per component. Commit at the component boundary, not the iteration boundary. A typical sequence:

- `feat(<area>): <component> with <key behaviors>` — the component + dev page + any primitive additions it required.
- `chore: code-quality sweep` — if running lint/dead-code tools surfaced fixes touched along the way.

Don't commit the scratch file's body. Its header lives in git; its body is ephemeral working state.

## When to stop

When the user writes `approved` or `ship it` inside the scratch file body. Not when the agent thinks it looks good — the agent's threshold for "done" is consistently lower than the user's. Wait for the explicit signal, then reset the file and move on.
