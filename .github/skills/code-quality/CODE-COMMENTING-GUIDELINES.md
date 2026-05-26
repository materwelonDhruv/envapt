---
name: code-commenting-guidelines
description: Use this when writing, refactoring, or reviewing TypeScript code. Defines when comments are required, when they are noise, and how to document guardrails, invariants, and non-obvious logic without bloating the codebase.
---

# Code Commenting Guidelines

Use comments to explain intent, constraints, and hidden rules. Do not use comments to narrate obvious syntax.

## When Comments Are Required

Add a short comment when one of these is true:

- A rule exists because of an architectural constraint (auth boundary, caching strategy, ordering requirement, external API contract).
- A code path intentionally bypasses the more common path.
- A condition protects an invariant that would otherwise look arbitrary.
- A calculation uses authored offsets, tolerances, or thresholds in a non-obvious way.
- A validation or guardrail exists to prevent a subtle regression.

## When Comments Are Noise

Do not add comments for:

- Straightforward assignments or returns.
- Obvious control flow.
- Repeating a method or variable name in sentence form.
- General TypeScript or Node.js basics the code already expresses clearly.

Bad:

```ts
// Set the user's display name.
user.displayName = payload.name;
```

Good:

```ts
// Display name is set from the OAuth payload at login time; later edits go through updateProfile().
user.displayName = payload.name;
```

## Preferred Comment Style

- Keep comments short and local.
- Prefer `//` inline comments over JSDoc for implementation details.
- Use JSDoc (`/** */`) only on public API surfaces where callers need context; keep them minimal.
- Put the comment immediately above the line or block whose intent is non-obvious.
- Explain why the rule exists or what breaks if it changes.

## Good Patterns

Guardrails:

```ts
// Mutations must be validated server-side before write; client input is untrusted at this point.
if (!isVerifiedRequest(req)) throw new ForbiddenError();
```

Non-obvious branching:

```ts
// Retry only on 429 and 503; other 5xx errors indicate a data problem and should not be retried.
if (status === 429 || status === 503) {
    return scheduleRetry(job);
}
```

Invariants:

```ts
// Items are sorted ascending by createdAt before this point; binary search below depends on it.
const index = binarySearch(items, targetDate);
```

Thresholds and authored values:

```ts
// 50ms debounce matches the minimum polling interval guaranteed by the upstream service contract.
const DEBOUNCE_MS = 50;
```

## Anti-Patterns To Avoid

Do not turn the codebase into a wall of commentary.

Avoid:

- Commenting every branch in a method.
- Large banner comments that restate the whole function.
- JSDoc on every member just to satisfy documentation goals.
- Bug-history comments tied to one incident unless the history is essential to the rule.

Bad:

```ts
/**
 * Sets the active state.
 * @param value The value to set.
 */
setActive(value: boolean) {
    // Set active to value.
    this.active = value;
}
```

Good:

```ts
// Active flag gates all outbound event emission; callers must set this before subscribing.
setActive(value: boolean) {
    this.active = value;
}
```

## Review Checklist

Before adding a comment, ask:

1. Does this explain a hidden rule, guardrail, or non-obvious consequence?
2. Would a future engineer likely misread this code without the comment?
3. Is the comment shorter and clearer than extracting another method right now?
4. Does the comment avoid repeating what the code already says?

If the answer to the first two questions is no, do not add the comment.
