---
name: tailwind
description: Use this when writing Tailwind CSS in the envapt guide (apps/guide). Covers the v4 CSS-first setup with @tailwindcss/postcss (Next.js), the brand tokens in global.css, cn(), @theme CSS variables, opacity modifiers, responsive discipline, size/padding shorthands, container queries, and v4-specific gotchas that differ from v3.
---

# Tailwind CSS v4 (envapt Conventions)

`apps/guide` is a Next.js 16 + React 19 Fumadocs site on **Tailwind v4** through the `@tailwindcss/postcss` plugin. There is no `tailwind.config.js` and no v3 directives. `app/global.css` is the one stylesheet. It imports Tailwind and the Fumadocs presets, holds the `@theme` fonts, and defines the brand tokens. `lib/cn.ts` exports `cn`. The components in `components/` are the primitives.

---

## Setup Pattern (v4 + Next.js 16)

```css
/* apps/guide/app/global.css */
@import 'tailwindcss'; /* replaces @tailwind base/components/utilities */
@import 'fumadocs-ui/css/neutral.css';
@import 'fumadocs-ui/css/preset.css';
@import 'fumadocs-twoslash/twoslash.css';

/* Tailwind v4 must scan the fumadocs-ui package for the classes it uses */
@source '../node_modules/fumadocs-ui/dist/**/*.js';
```

```js
/* apps/guide/postcss.config.mjs */
const config = { plugins: { '@tailwindcss/postcss': {} } };
export default config;
```

**Never use the old v3 directives** (`@tailwind base`, `@tailwind components`, `@tailwind utilities`). They don't exist in v4.

Class scanning is automatic for files inside `apps/guide`. A package outside the tree that ships class strings needs its own `@source` line, like the `fumadocs-ui` one above. Without it, v4's scanner won't find those classes and they'll be purged in production.

---

## Rule 1: Use `cn()` for dynamic classNames

`cn` is exported from `@/lib/cn`. It wraps `clsx` + `tailwind-merge`:

- Deduplicates conflicting Tailwind utilities: `cn('px-2', 'px-4')` → `'px-4'`.
- Filters falsy values, so you don't need `.filter(Boolean)` or empty-string ternaries.

```tsx
// Bad
const cls = ['base', isActive ? 'bg-(--ev-brand)' : ''].join(' ');

// Good
import { cn } from '@/lib/cn';
const cls = cn('base', isActive && 'bg-(--ev-brand)');
```

**The only legitimate use of `.join(' ')` in this repo** is joining non-className strings (CLI args, log fragments).

---

## Rule 2: Brand tokens live in `global.css`

`:root` in `app/global.css` holds the `--ev-*` brand tokens for the light theme, and `.dark` overrides them for the dark theme. `@theme` can't switch on the theme, so only the fonts live there. Fumadocs' own `--color-fd-*` variables get remapped onto the brand tokens in the same file.

```css
:root {
    --ev-bg: #ece6db;
    --ev-link: #bc4f13;
    --ev-brand: #de6e39;
    --ev-info-soft: color-mix(in oklab, var(--ev-info) 10%, transparent);
}

.dark {
    --ev-bg: #13171a;
    --ev-link: #c76435;
}
```

Use the Fumadocs utilities (`bg-fd-card`, `text-fd-muted-foreground`, `border-fd-border`) for surfaces Fumadocs already themes. Use the `--ev-*` tokens for brand color.

**Reference tokens via `bg-(--token-name)` (v4 paren syntax). The `bg-[var(--token-name)]` v3 bracket syntax doesn't apply in v4.**

```tsx
// Bad: v3 syntax / arbitrary hex
<div className="bg-[var(--ev-brand)] text-[#de6e39]" />

// Good: v4 paren + token
<div className="bg-(--ev-brand) text-(--ev-brand)" />
```

---

## Rule 3: Use color-mix for derived shades

`global.css` already derives the soft callout backgrounds and the light-mode Fumadocs surfaces with `color-mix(in oklab, …)`:

```css
--ev-danger-soft: color-mix(in oklab, var(--ev-danger) 12%, transparent);
--color-fd-card: color-mix(in oklab, var(--ev-bg), #fff 22%);
```

Never hard-code a darker hex by eye when `color-mix` (or Tailwind's `bg-color/50` opacity modifier) gives a derived value that updates if the base token changes.

---

## Rule 4: Class shorthands (catch by review)

### Collapse equal `w-N h-N` to `size-N`

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

### Collapse equal `px-N py-N` to `p-N`

```tsx
// Bad
<div className="px-6 py-6" />

// Good
<div className="p-6" />
```

### `font-semibold` on headings (never `font-bold` / `font-extrabold` / `font-black`)

```tsx
// Bad
<h2 className="font-extrabold">Title</h2>

// Good
<h2 className="font-semibold">Title</h2>
```

Heading elements (h1-h6) must use `font-semibold` at most. This is review-enforced. Catch it in code review.

---

## Rule 5: Responsive discipline (mobile-first)

Tailwind breakpoints: `sm` (640px) `md` (768px) `lg` (1024px) `xl` (1280px).

**Mobile-first always.** Write the mobile default first, add `sm:`/`md:`/`lg:` for larger viewports:

```tsx
// Bad: desktop-first (shrinking on larger screens is wrong direction)
<div className="text-2xl md:text-lg" />

// Good
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
<div className="text-sm md:text-base lg:text-lg" />
```

For JS-driven breakpoint checks, prefer matchMedia in a `useEffect` over reading `window.innerWidth` on render (which crashes during SSR).

**v4 behavior change:** `hover:` only fires on devices that support hover (pointer: fine). It no longer triggers on mobile tap. This is correct and intentional. Don't try to work around it.

---

## Rule 6: Avoid arbitrary values when a token exists

```tsx
// Bad: both have token equivalents in global.css
<div className="border-[#c3b9a6]" />                              // → border-(--ev-gutter)
<div className="text-[#de6e39]" />                                 // → text-(--ev-brand)
```

Arbitrary values are acceptable only when the design genuinely requires a one-off value that isn't and shouldn't become a system token.

**CSS variable arbitrary values** use parentheses in v4:

```tsx
// Bad: v3 syntax
<div className="bg-[--my-custom-var]" />

// Good: v4 syntax
<div className="bg-(--my-custom-var)" />
```

---

## Rule 7: Co-locate component variants with the component

Put `BASE`, `VARIANTS`, and any size map as string constants at the top of the component file. Don't invent a `cva`-style abstraction. `components/BaseButton.tsx` is the convention.

```tsx
// matches components/BaseButton.tsx
type Variant = 'solid' | 'ghost' | 'segment';

const BASE = 'inline-flex items-center gap-1.5 font-mono font-semibold leading-none whitespace-nowrap …';

const VARIANTS: Record<Variant, string> = {
    solid: 'px-5 py-3 rounded-[10px] text-(--ev-on-brand) bg-(--ev-brand) hover:bg-(--ev-link-hover)',
    ghost: 'px-5 py-3 rounded-[10px] border border-fd-border hover:border-(--ev-link) hover:text-(--ev-link)',
    segment: 'h-[34px] px-3 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground'
};
```

---

## v4 Gotchas vs v3

<!--prettier-ignore-start-->

| Pattern | v3 | v4 |
| --- | --- | --- |
| Opacity utilities | `bg-opacity-50` | `bg-color/50` (old removed) |
| CSS var in arbitrary | `bg-[--var]` | `bg-(--var)` |
| Important modifier | `!flex` | `flex!` |
| Bare `ring` class | 3px blue | 1px currentColor (write `ring-3 ring-(--ev-link)`) |
| Bare `border` class | gray-200 | currentColor (always add a color) |
| `outline-none` | hides outline | sets `outline: none` literally (use `outline-hidden` to visually hide) |
| Shadow scale | `shadow-sm` is small | `shadow-sm` in v4 = v3's bare `shadow` (scale shifted down) |
| Container queries | requires plugin | built-in (use `@container` + `@sm:` directly) |
| `hover:` on mobile | fires on tap | only on hover-capable devices |
| Config | `tailwind.config.js` | `@theme {}` in CSS or `:root` custom properties |
| Content scanning | `content: []` in config | automatic in Next.js (`@source` for files outside the tree) |

<!--prettier-ignore-end-->

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

<!--prettier-ignore-start-->

| Pattern | What to do instead |
| --- | --- |
| `bg-[#hex]` when a token exists | `bg-(--token-name)` |
| `bg-opacity-50` | `bg-color/50` |
| `bg-[--var]` | `bg-(--var)` |
| `[a, b].join(' ')` for classNames | `cn(a, b)` from `@/lib/cn` |
| `w-N h-N` same value | `size-N` |
| `px-N py-N` same value | `p-N` |
| `font-bold` / `font-extrabold` on headings | `font-semibold` |
| Inline variant map mixed into JSX | Lift to a `VARIANTS` const above the component |
| A one-off color in a component | Add an `--ev-*` token to `global.css` |
| `window.innerWidth` read during render | Use matchMedia in `useEffect` |
| A dependency that ships class strings, no `@source` | Add `@source` pointing to it in `global.css` |
| `outline-none` to hide focus ring | `outline-hidden` |
| `@tailwind base/components/utilities` | `@import 'tailwindcss'` |
| `bg-[var(--token)]` (v3 var-in-bracket syntax) | `bg-(--token)` (v4 paren syntax) |

<!--prettier-ignore-end-->
