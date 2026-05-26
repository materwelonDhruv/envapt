---
name: typescript
description: Use this when writing TypeScript in seedcord. Covers type narrowing, generics, utility types, discriminated unions, branded types, const assertions, the satisfies operator, and the type discipline rules that apply across the repo.
---

# TypeScript Quality — Seedcord Conventions

This repo runs strict TypeScript. `any` is banned in production code. The goal is types that accurately describe the domain, not types that silence the compiler.

---

## Rule 1 — Narrow, don't cast

The first instinct when TypeScript complains should be narrowing, not casting.

```ts
// Bad — casting silences the error but loses safety
const name = (response as any).user.name;

// Good — narrow with a type guard
function hasName(v: unknown): v is { name: string } {
    return typeof v === 'object' && v !== null && 'name' in v && typeof (v as Record<string, unknown>).name === 'string';
}
if (hasName(response)) { const name = response.name; }
```

Use `typeof`, `instanceof`, `in`, and discriminated union checks before reaching for a cast. When a third-party library forces a cast, use a single `as Expected` with `// justified: <reason>`.

---

## Rule 2 — Discriminated unions over optional fields

Model state as a discriminated union instead of a flat type with many optionals. It makes exhaustive matching compile-enforced.

```ts
// Bad — impossible states are representable
type RequestState = {
    isLoading: boolean;
    data?: User;
    error?: string;
};

// Good — mutually exclusive states
type RequestState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: User }
    | { status: 'error'; error: string };

// Exhaustive handling
switch (state.status) {
    case 'idle': return null;
    case 'loading': return <Spinner />;
    case 'success': return <Profile user={state.data} />;
    case 'error': return <Error msg={state.error} />;
}
```

---

## Rule 3 — Type guards and assertion functions

Write typed predicates for reusable narrowing:

```ts
// Type predicate — returns boolean, narrows in if-block
function isString(v: unknown): v is string {
    return typeof v === 'string';
}

// Assertion function — throws on failure, narrows after call
function assertDefined<T>(v: T | null | undefined, msg: string): asserts v is T {
    if (v == null) throw new Error(msg);
}

// Usage
assertDefined(user, 'user must be loaded before calling this');
// TypeScript now knows user is T (not null/undefined)
console.log(user.name);
```

---

## Rule 4 — Generics: constrain early, infer where possible

Don't write `T extends any` — constrain generics meaningfully. Let TypeScript infer the type argument when the call site makes it unambiguous.

```ts
// Bad — unconstrained, no information at call site
function first<T>(arr: T[]): T | undefined { return arr[0]; }

// Good — same, but let inference do the work
const first = <T>(arr: T[]): T | undefined => arr[0];
const item = first([1, 2, 3]); // inferred: number | undefined

// Constrain when the shape matters
function getKey<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}
```

Avoid generic parameter lists longer than 3 — if you need more, your abstraction is probably wrong.

---

## Rule 5 — Prefer built-in utility types over manual mappings

TypeScript ships `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `ReturnType`, `Parameters`, `Awaited`, `NonNullable`, `Extract`, `Exclude`. Use them instead of manual mapped types.

```ts
// Bad — manual mapped type
type PartialUser = { [K in keyof User]?: User[K] };

// Good
type PartialUser = Partial<User>;

// Extracting function return type
type ApiResult = Awaited<ReturnType<typeof fetchUser>>;

// Making specific keys optional
type UserDraft = Omit<User, 'id'> & Partial<Pick<User, 'id'>>;
```

**`type-fest`** is available for transforms that built-in utilities don't cover: `ReadonlyDeep`, `PartialDeep`, `Merge`, `SetRequired`, `SetOptional`, `ConditionalKeys`, `ValueOf`, etc. Use it instead of writing complex mapped types from scratch.

---

## Rule 6 — `satisfies` for type-checked literals

`satisfies` validates a value against a type without widening it. Use it to catch mistakes in constant maps while keeping the literal types.

```ts
// Bad — type annotation widens to string, losing literal inference
const routes: Record<string, string> = {
    home: '/',
    about: '/about',
    // typo in key: 'abut' would not be caught until runtime
};

// Good — satisfies validates without widening
const routes = {
    home: '/',
    about: '/about',
} satisfies Record<string, string>;

routes.home; // type: '/' (literal), not string
```

```ts
// Enforce exhaustive config objects
type Status = 'pending' | 'fulfilled' | 'cancelled';
const statusLabels = {
    pending: 'Pending',
    fulfilled: 'Fulfilled',
    cancelled: 'Cancelled',
} satisfies Record<Status, string>;
// Adding a new Status without updating statusLabels is a compile error
```

---

## Rule 7 — `const` assertions for literal inference

Use `as const` to narrow a value to its literal type and make arrays/objects `readonly`.

```ts
// Without as const — types are widened
const directions = ['north', 'south', 'east', 'west']; // string[]

// With as const — literal tuple
const directions = ['north', 'south', 'east', 'west'] as const;
// readonly ['north', 'south', 'east', 'west']
type Direction = typeof directions[number]; // 'north' | 'south' | 'east' | 'west'
```

Combine with `satisfies` for validated, literal-preserving config:

```ts
const buttonSizes = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
} as const satisfies Record<string, string>;
```

---

## Rule 8 — Branded types for domain primitives

Prevent passing the wrong `string` (e.g., a user ID where an order ID is expected) by branding primitive types.

```ts
type OrderId = string & { readonly __brand: 'OrderId' };
type UserId = string & { readonly __brand: 'UserId' };

function createOrderId(raw: string): OrderId {
    return raw as OrderId; // single justified cast at the boundary
}

function getOrder(id: OrderId): Promise<Order> { ... }

const userId = createUserId('abc');
getOrder(userId); // TypeScript error — UserId is not OrderId
```

Use branded types at domain boundaries: API response IDs, route params, currency amounts. Don't brand everything — only where confusion between same-primitive types causes real bugs.

---

## Rule 9 — `unknown` at external boundaries, narrow before use

At system boundaries (API responses, `JSON.parse`, user input, `localStorage`), the incoming value is `unknown`. Validate it with a type guard or Zod schema before using.

```ts
// Bad — trusting unvalidated external data
const user = JSON.parse(raw) as User;

// Good — validate at the boundary with a runtime type guard
//   (or a Zod schema, if Zod is in use in the consuming package)
function isUser(v: unknown): v is User {
    return typeof v === 'object'
        && v !== null
        && typeof (v as Record<string, unknown>).id === 'string';
}

const parsed: unknown = JSON.parse(raw);
if (!isUser(parsed)) throw new Error('Invalid user data');
const user = parsed; // User
```

Inside the validated boundary, trust the types. Don't add defensive `?.` chains on values you know are non-null — that hides bugs.

---

## Rule 10 — Template literal types for string APIs

Use template literal types to model string patterns:

```ts
type EventName = `on${Capitalize<string>}`;
type CSSVar = `--${string}`;
type RoutePath = `/${string}`;

// Enforce naming conventions at the type level
function registerHandler(name: EventName, fn: () => void): void { ... }
registerHandler('onClick', fn);   // ok
registerHandler('click', fn);     // TypeScript error
```

---

## What not to do

```ts
// ❌ any in production
let value: any;

// ❌ Double casts
const v = x as unknown as T;  // fix the declaration instead

// ❌ Silently widening with as
const id = rawId as string;    // use a type guard or validated cast at boundary

// ❌ Redundant non-null assertions when the type is already correct
const el = ref.current!;  // if ref.current is HTMLDivElement | null, use assertDefined() or check first

// ❌ import('pkg').Type inline
type X = import('pkg').SomeType;  // use: import type { SomeType } from 'pkg';

// ❌ Generic typed useReducer (deprecated form)
useReducer<React.Reducer<State, Action>>(reducer);  // use: useReducer(reducer) with inferred types
```
