---
name: code-commenting-guidelines
description: Use this when writing, refactoring, or reviewing TypeScript code. Defines when comments are required, when they are noise, and how to document guardrails, invariants, and non-obvious logic without bloating the codebase.
---

# Code Commenting Guidelines

Use comments to explain intent, constraints, and hidden rules. Do not use comments to narrate obvious syntax.

> **Related:** this skill decides _whether_ and _where_ a comment belongs. For _how_ a comment should read once you write it (voice, word choice, no hype or anthropomorphism), see the `writing-voice` skill.

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

## Failure Patterns To Avoid

The fastest way to slip past the checklist is to write a comment that LOOKS like a "why" but actually narrates the code first and then tacks the why on the end. Catch these:

### Narrate-then-justify

```ts
// Anti: lead-in restates the next line; only the second sentence is load-bearing.
// We anchor the write to BaseClass rather than `this`: subclass calls would otherwise
// create an own property on the subclass while readers walk up to the base and miss it.
BaseClass._strict = value;
```

```ts
// Drop the lead-in. Lead with the why.
// Anchored to BaseClass: `this._strict = value` creates an own-property on the subclass
// that callers reading via the base won't see.
BaseClass._strict = value;
```

### Type-system paraphrase

If a comment explains a TYPE definition that's two lines above, the comment is redundant. Either the type is sufficient on its own, or the type needs a better name. Rewriting the type is almost always the right fix.

```ts
// Anti: re-states the type structure in prose right next to the type.
// `EnvaptOptions` is a discriminated union over `required` so the compile-time check
// rejects `required: true` paired with `fallback`. The runtime Validator catches the
// dynamic case that bypasses the types.
type EnvaptOptions =
    | { required: false; fallback?: T }
    | { required: true; fallback?: Err<'...'> };

// Good: the brand-name and Err<> explanation belong on the brand type itself, once.
// Consumers don't need a paragraph re-explaining the union.
```

### Overload narration

Multiple overload signatures next to short `//` comments labeling each one ("Time-specific overload", "Required form, time-specific", "Required form, built-in/array") are noise: the signature already conveys this. If users need a map of overloads, write ONE TSDoc block on the implementation signature describing the family, not a per-overload caption.

### Stale-after-refactor

Every refactor invalidates some "why" comments. When you delete an overload, change a return type, or revert a design, **grep for the names you removed and clean up every comment that references them**. A stale comment is worse than a missing one: it actively misleads.

### JSDoc on `@internal` helpers

Internal helpers don't need IDE-hover documentation. Use a single `//` line when a why exists, and zero comments when the function's name + body are self-explanatory. The four-line `/** ... */` block on a one-line accessor is signal that the function name is too thin or the block is decoration.

### "I'm doing X" wrapper

Comments that lead `// We do X here because...` always contain redundancy: the next line shows you doing X. Drop the wrapper, keep the because.

```ts
// Anti: `// Resolve key, then check missing under strict, then throw.` narrates 3 lines below.
// Good: NO comment. The three function calls below are self-evident.
```

## Why "Drop the comment" is usually right

When in doubt: delete the comment, re-read the code without it, and ask "would a careful reader misunderstand this?" If the answer is no, the comment was decoration. The bar is "would mislead without it," not "would be slightly faster to read with it." Speed gains from prose-restating-code are smaller than the maintenance cost of keeping the comment honest across refactors.
