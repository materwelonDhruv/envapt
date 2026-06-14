---
name: tdd
description: Test-driven development with red-green-refactor loop. Use when user wants to build features or fix bugs using TDD, mentions "red-green-refactor", wants integration tests, or asks for test-first development.
---

# Test-Driven Development

## Philosophy

Tests verify behavior through public interfaces, not implementation details. The code underneath can change completely and the test stays green.

**Good tests** exercise real code paths through public APIs. They describe what the system does, not how. A name like `'throws while a key is cooling down and recovers after the window'` states a capability. Such tests survive refactors because they read no internal structure.

**Bad tests** couple to internal structure. They mock collaborators you own, reach into private methods, or verify through a side channel instead of the interface. The tell is a test that breaks when you rename an internal function while behavior is unchanged. That test was checking implementation.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for when mocking is warranted.

## Anti-pattern: horizontal slices

Do not write all the tests first and then all the implementation. That treats RED as "write every test" and GREEN as "write every line of code."

This produces weak tests:

- Tests written in bulk check imagined behavior, not real behavior.
- You assert on the shape of things (data structures, signatures) instead of observable behavior.
- The tests pass when behavior breaks and fail when behavior is fine.
- You commit to a test structure before the implementation teaches you what matters.

Write vertical slices instead. One test, then one implementation, then repeat. Each test answers what the last cycle taught you. You just wrote the code, so you know which behavior matters and how to check it.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED then GREEN: test1 then impl1
  RED then GREEN: test2 then impl2
  RED then GREEN: test3 then impl3
```

## Where tests live in this repo

Tests sit in `<package>/tests/`, mirroring `src/`. Never `src/**/*.test.ts`. A test for `packages/services/src/CooldownManager.ts` is `packages/services/tests/cooldown-manager.test.ts`.

Vitest is the runner. `pnpm -C <pkg> test` runs the suite once. `pnpm -C <pkg> test:watch` watches and reruns on change, which is the loop you want during a TDD cycle.

Run `lint:fix` and `tc` before you run tests. A test file that does not type-check has not run yet.

```sh
pnpm -C <pkg> lint:fix
pnpm -C <pkg> tc
pnpm -C <pkg> test:watch   # during the loop
pnpm -C <pkg> test         # once before you commit
```

Tests reach the framework through public exports (`@seedcord/types`, the package `@src` alias) and may use a pragmatic fixture cast (`as unknown as T`) with a one-line justification comment. No `as any` in tests. The ESLint rule rewrites `any` to `unknown`, which surfaces a real type error if the cast was wrong.

For framework-level behavior that needs a running bot, `mock/` is the runnable Discord-bot harness. Wire integration tests into it rather than faking the client by hand.

## Workflow

### 1. Plan

Before any code:

- [ ] Confirm with the user which interface changes the feature needs.
- [ ] Confirm which behaviors to test, in priority order.
- [ ] Look for [deep modules](deep-modules.md), a small interface over a deep implementation.
- [ ] Design interfaces for [testability](interface-design.md).
- [ ] List behaviors to test, not implementation steps.
- [ ] Get user approval on the plan.

Ask: "What should the public interface look like? Which behaviors matter most to test?"

You cannot test everything. Confirm which behaviors matter and put the effort on the critical paths and the complex logic, not every edge case.

### 2. Tracer bullet

Write ONE test for ONE behavior.

```
RED:   write the test for the first behavior, it fails
GREEN: write the minimal code to pass, it passes
```

The tracer bullet proves the path works end to end.

### 3. Incremental loop

For each remaining behavior:

```
RED:   write the next test, it fails
GREEN: minimal code to pass, it passes
```

Rules:

- One test at a time.
- Only enough code to pass the current test.
- Do not write for tests you have not written yet.
- Keep each test on observable behavior.

### 4. Refactor

Once the tests pass, look for [refactor candidates](refactoring.md):

- [ ] Extract duplication.
- [ ] Deepen modules, move complexity behind a simple interface.
- [ ] Apply SOLID where it fits, no premature abstraction.
- [ ] Note what the new code reveals about existing code.
- [ ] Rerun tests after each refactor step.

Do not refactor while RED. Get to GREEN first.

For a published package, add a changeset (`pnpm cs`) once the slice is done.

## Checklist per cycle

```
[ ] Test describes behavior, not implementation
[ ] Test uses the public interface only
[ ] Test would survive an internal refactor
[ ] Code is minimal for this test
[ ] No speculative features added
```
