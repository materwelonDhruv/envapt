---
name: fail-fast-rules
description: Use this when writing, refactoring, or reviewing code paths that involve null handling, invariant checks, optional dependencies, or async resource access patterns. Enforces the project fail-fast policy from AGENTS.md.
---

# Fail-Fast Rules

Extracted from AGENTS.md, section "Fail-Fast Principle".

Do not silently swallow missing values. If a reference is assumed to exist, use it directly. If it's missing, let the error surface and fix the root cause — do not paper over it with a cast or a silent fallback.

**Explicit checks are only warranted in two cases:**

1. **Invariant violations** - if a condition represents a contract that must always hold (wrong execution context, invalid state, missing required config, auth mismatch), throw with a descriptive message. Never guard-and-return silently.
2. **Expected optional branches** - if a null/undefined value is a valid runtime possibility with defined behavior (optional dependency, missing config with a real fallback), guard explicitly using `?.` and `??` and handle intentionally. Never fall back to a silent or meaningless default.

Everything else: use directly, let it throw, fix the root cause.

**On `?.` and `??`:** these are valid and preferred over casts — but only when the nullish case is a genuinely expected branch with intentional handling. Do not reach for them as a reflexive way to suppress errors. Never use them as a substitute for fixing a broken assumption.

```ts
// Bad — silently swallows a missing dependency; hides a broken contract
const result = service?.doThing() ?? null;

// Good — null is a documented valid state with real handling
const user = session?.user ?? guestUser;

// Bad — casts away the problem instead of fixing it
const name = (obj as any).name;

// Good — let it throw if the contract is violated
const name = obj.name;
```
