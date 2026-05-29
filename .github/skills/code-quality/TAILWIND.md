---
name: tailwind
description: Use this when writing Tailwind CSS in any breach app or package. Covers the v4 CSS-first setup, cn() and tokens.ts class fragments, @theme CSS variables, opacity modifiers, responsive discipline, size/padding shorthands, container queries, and v4-specific gotchas that differ from v3.
---

# Tailwind CSS v4 — Breach Conventions

This repo uses **Tailwind v4** with the `@tailwindcss/vite` plugin — no `tailwind.config.js`, no PostCSS chain. Design tokens live in `packages/ui/src/styles/tokens.css` (`@theme {}`) and `packages/ui/src/lib/tokens.ts` (class-fragment constants). All apps consume them via `@breach/ui`.

---

## Setup Pattern (v4-native)

Both apps use this identical setup:

```css
/* apps/<name>/src/styles/globals.css */
@import 'tailwindcss'; /* single import — replaces @tailwind base/components/utilities */
@import '@breach/ui/styles/tokens.css'; /* pulls in @theme tokens */

@source '../../../../packages/ui/src'; /* scan external packages for class names */
@source '../../../../packages/web/src';
```

```ts
/* vite.config.ts */
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()] });
```

**Never use the old v3 directives** (`@tailwind base`, `@tailwind components`, `@tailwind utilities`) — they don't exist in v4.

**If you add a new package whose components use Tailwind classes**, add a `@source` line pointing to it. Without it, v4's scanner won't find those classes and they'll be purged in production.

---

## Rule 1 — Use `cn()` for dynamic classNames

`cn` is exported from `@breach/ui`. It wraps `clsx` + `tailwind-merge`:

- Deduplicates conflicting Tailwind utilities: `cn('px-2', 'px-4')` → `'px-4'`.
- Filters falsy values — no `.filter(Boolean)` or empty-string ternaries.

```tsx
// Bad
const cls = ['base', isActive ? 'bg-deep-olive' : ''].join(' ');

// Good
import { cn } from '@breach/ui';
const cls = cn('base', isActive && 'bg-deep-olive');
```

**The only legitimate use of `.join(' ')` in this repo** is joining non-className strings (address parts, CLI args).

---

## Rule 2 — Use `tokens.ts` class fragments before writing raw classes

`packages/ui/src/lib/tokens.ts` exports named class-fragment constants. Check these before duplicating raw class strings:

| Constant                    | What it covers                                                    |
| --------------------------- | ----------------------------------------------------------------- |
| `radii`                     | `control` / `surface` / `emphasis` / `pill` radius shortcuts      |
| `buttonBaseClassName`       | Base layout, focus ring, transitions for buttons                  |
| `buttonVariantClasses`      | `primary`, `secondary`, `ghost`, `destructive` fills              |
| `buttonSizeClasses`         | `sm`, `md`, `lg` sizing + radius                                  |
| `cardVariantClasses`        | `default`, `stat`, `highlight`, `danger`, `success` card shells   |
| `cardSizeClasses`           | `sm` / `md` / `lg` padding                                        |
| `fieldControlBaseClassName` | Base for Input/Textarea/Select                                    |
| `fieldSurfaceClasses`       | `default` / `cream` border + bg + radius                          |
| `fieldSizeClasses`          | `compact` / `md` padding                                          |
| `fieldStateClasses`         | `error` / `disabled` visual states                                |
| `labelVariantClasses`       | `default` / `caps` / `form` label colors                          |
| `badgeToneClasses`          | `neutral`, `olive`, `success`, `warning`, `danger`, `muted` fills |
| `statusLabelClassName`      | `text-xs font-bold tracking-[0.3em] uppercase text-sage-green`    |
| `mutedTextClassName`        | `text-sm text-warm-beige`                                         |
| `elevatedShadowClassName`   | `shadow-md ring-1 ring-deep-olive/5`                              |
| `modalSectionClasses`       | `header` / `body` / `footer` padding                              |
| `drawerSectionClasses`      | `header` / `body` / `footer` padding                              |

```tsx
// Bad — raw duplicated classes
<button className="rounded-md px-3 py-2 text-xs tracking-wide bg-deep-olive text-soft-cream" />;

// Good — compose from tokens
import { buttonBaseClassName, buttonVariantClasses, buttonSizeClasses } from '@breach/ui';
<button className={cn(buttonBaseClassName, buttonVariantClasses.primary, buttonSizeClasses.sm)} />;
```

If you need a class fragment more than twice and it isn't a token yet, **add it to `tokens.ts` first**, rebuild, then use it. Never inline it.

---

## Rule 3 — Use CSS variables for color and typography

`packages/ui/src/styles/tokens.css` defines `@theme {}`. In v4, every `--color-*` and `--font-*` variable automatically generates utility classes:

```css
@theme {
    --color-deep-olive: #3e3f29; /* → bg-deep-olive, text-deep-olive, border-deep-olive, fill-deep-olive, … */
    --color-soft-cream: #f1f0e4;
    --color-cream-edge: #dcdac8;
    --color-sage-green: #7d8d86;
    --font-display: 'Manrope', sans-serif; /* → font-display */
    --font-serif: 'Playfair Display', serif; /* → font-serif */
}
```

You can also reference these as CSS variables directly in custom CSS or inline styles:

```css
/* In custom CSS */
.my-element {
    background: var(--color-deep-olive);
}
```

```tsx
// In JS/TSX (e.g. animation libraries)
<motion.div animate={{ backgroundColor: 'var(--color-deep-olive)' }} />
```

```tsx
// Bad — arbitrary hex that should be a token
<div className="bg-[#3e3f29] text-[#f1f0e4]" />

// Good
<div className="bg-deep-olive text-soft-cream" />
```

**Never add a `@theme` block to an app's `globals.css`.** The palette lives exclusively in `packages/ui/src/styles/tokens.css`. Apps consume it via `@import '@breach/ui/styles/tokens.css'`.

---

## Rule 4 — Opacity modifier syntax (v4 native)

v4 uses the forward-slash opacity modifier. The old `bg-opacity-*` / `text-opacity-*` utility classes **do not exist in v4**.

```tsx
// Bad — v3 syntax, DOES NOT WORK in v4
<div className="bg-deep-olive bg-opacity-30" />
<div className="text-deep-olive text-opacity-60" />

// Good — v4 forward-slash modifier
<div className="bg-deep-olive/30" />
<div className="text-deep-olive/60" />
<div className="border-deep-olive/10" />
<div className="ring-deep-olive/30" />
<div className="placeholder:text-deep-olive/40" />
```

This applies to all color utilities: `bg-*`, `text-*`, `border-*`, `ring-*`, `shadow-*`, `divide-*`, `placeholder-*`, `fill-*`, `stroke-*`.

---

## Rule 5 — react-doctor enforced shorthands

### `size-N` instead of `w-N h-N`

When both axes are equal, collapse to `size-N`:

```tsx
// Bad
<div className="w-4 h-4" />
<Icon className="w-6 h-6" />

// Good
<div className="size-4" />
<Icon className="size-6" />
```

Exception: when axes differ (`w-8 h-4`), keep them separate.

### `p-N` instead of `px-N py-N` (when equal)

```tsx
// Bad
<div className="px-6 py-6" />

// Good
<div className="p-6" />
```

### `font-semibold` on headings — never `font-bold` / `font-extrabold` / `font-black`

```tsx
// Bad
<h2 className="font-extrabold">Title</h2>

// Good
<h2 className="font-semibold">Title</h2>
```

Enforced by `react-doctor/design-no-bold-heading`. Heading elements (h1–h6) must use `font-semibold` at most.

---

## Rule 6 — Responsive discipline (mobile-first)

Tailwind breakpoints: `sm` (640px) `md` (768px) `lg` (1024px) `xl` (1280px).

**Mobile-first always.** Write the mobile default first, add `sm:`/`md:`/`lg:` for larger viewports:

```tsx
// Bad — desktop-first (shrinking on larger screens is wrong direction)
<div className="text-2xl md:text-lg" />

// Good
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
<div className="text-sm md:text-base lg:text-lg" />
```

**Prefer `useResponsive()` from `@breach/web`** for JS-driven breakpoint checks — don't add `window.innerWidth` checks or new `ResizeObserver` hooks.

**v4 behavior change:** `hover:` only fires on devices that support hover (pointer: fine). It no longer triggers on mobile tap. This is correct and intentional — don't try to work around it.

---

## Rule 7 — Avoid arbitrary values when a token exists

```tsx
// Bad — all have token equivalents
<div className="border-[#dcdac8]" />      // → border-cream-edge
<div className="text-sage-green tracking-[0.3em] uppercase font-bold text-xs" /> // → cn(statusLabelClassName)
```

Arbitrary values are acceptable only when the design genuinely requires a one-off value that isn't and shouldn't be a system token.

**CSS variable arbitrary values** — in v4, use parentheses, not brackets:

```tsx
// Bad — v3 syntax
<div className="bg-[--my-custom-var]" />

// Good — v4 syntax
<div className="bg-(--my-custom-var)" />
```

---

## Rule 8 — No variant logic outside the design system

Don't write `cva()` or manual variant maps in app code. The `tokens.ts` constants already encode the variant system. If you need a new variant, add it to `tokens.ts` in `packages/ui`:

1. Add to the relevant constant (`buttonVariantClasses`, `cardVariantClasses`, etc.)
2. Rebuild `packages/ui` (`pnpm -C packages/ui build`)
3. Verify dependents (`pnpm -C apps/shop tc`)

```tsx
// Bad — reinventing the variant system in app code
const variantMap = { primary: 'bg-deep-olive text-soft-cream' };

// Good — extend tokens.ts, then use it
import { buttonVariantClasses } from '@breach/ui';
<button className={cn(buttonBaseClassName, buttonVariantClasses.primary)} />;
```

---

## v4 Gotchas vs v3

| Pattern              | v3                      | v4                                                                     |
| -------------------- | ----------------------- | ---------------------------------------------------------------------- |
| Opacity utilities    | `bg-opacity-50`         | `bg-color/50` (old removed)                                            |
| CSS var in arbitrary | `bg-[--var]`            | `bg-(--var)`                                                           |
| Important modifier   | `!flex`                 | `flex!`                                                                |
| Bare `ring` class    | 3px blue                | 1px currentColor — write `ring-3 ring-blue-500`                        |
| Bare `border` class  | gray-200                | currentColor — always add a color                                      |
| `outline-none`       | hides outline           | sets `outline: none` literally — use `outline-hidden` to visually hide |
| Shadow scale         | `shadow-sm` is small    | `shadow-sm` in v4 = v3's bare `shadow` (scale shifted down)            |
| Container queries    | requires plugin         | built-in — use `@container` + `@sm:` directly                          |
| `hover:` on mobile   | fires on tap            | only on hover-capable devices                                          |
| Config               | `tailwind.config.js`    | `@theme {}` in CSS                                                     |
| Content scanning     | `content: []` in config | `@source` directives in CSS                                            |

---

## Container Queries (built-in in v4)

No plugin needed. Use `@container` on the parent and `@sm:` etc. on children:

```tsx
<div className="@container">
    <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3" />
</div>;

{
    /* Named container */
}
<div className="@container/card">
    <p className="text-sm @md/card:text-base" />
</div>;
```

---

## Anti-patterns checklist

| Pattern                                         | What to do instead                            |
| ----------------------------------------------- | --------------------------------------------- |
| `bg-[#hex]` when a token exists                 | `bg-<token-name>`                             |
| `bg-opacity-50`                                 | `bg-color/50`                                 |
| `bg-[--var]`                                    | `bg-(--var)`                                  |
| `[a, b].join(' ')` for classNames               | `cn(a, b)` from `@breach/ui`                |
| `w-N h-N` same value                            | `size-N`                                      |
| `px-N py-N` same value                          | `p-N`                                         |
| `font-bold` / `font-extrabold` on headings      | `font-semibold`                               |
| Inline variant map                              | Extend `tokens.ts` in `packages/ui`           |
| `@theme {}` in app `globals.css`                | Consume from `@breach/ui/styles/tokens.css` |
| `window.innerWidth` for JS breakpoints          | `useResponsive()` from `@breach/web`        |
| New Tailwind package with classes, no `@source` | Add `@source` pointing to the package         |
| `outline-none` to hide focus ring               | `outline-hidden`                              |
| Custom CSS animations in tokens.css             | Add to app's `globals.css` only               |
| `@tailwind base/components/utilities`           | `@import 'tailwindcss'`                       |
