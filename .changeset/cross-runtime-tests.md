---
'envapt': patch
---

Add cross-runtime integration test layer under `packages/envapt/tests/integration/`.

- Hand-rolled `node:assert`-based smoke (6 portable suites + 1 Deno-only suite, ~30 assertions): basic get, every built-in converter, fallbacks, missing-file recovery, the `@Envapt` decorator's runtime install path, the v5 features (strict, debug, syncProcessEnv, require), and `@Envapt` syntax compiled by the host runtime's TS transpiler.
- Runs identically under Node, Bun, and Deno; consumes only the built `dist/index.mjs`.
- New `test:integration` package script for local Node runs.
- New GitHub Actions workflow `cross-runtime.yml`: build once, fanout across Node `[20, 22, 24]` on ubuntu plus Node 22 on macos and windows, plus Bun on ubuntu and Deno on ubuntu. Branch protection should gate on the aggregator `cross-runtime ok` job.

**Known limitation: Bun direct-`.ts` execution with `@Envapt` syntax.** Bun 1.3.10+ ignores the `experimentalDecorators` tsconfig flag and emits TC39 Stage 3 decorators ([bun#27575](https://github.com/oven-sh/bun/issues/27575)); envapt's `@Envapt` is a legacy TypeScript decorator and the call shapes are incompatible. Bun users who want the decorator API should precompile with `tsc` / `tsdown` / Vite first, then run the compiled output with Bun. The functional API (`Envapter.get`, `getNumber`, etc.) works without any build step under direct-`.ts` execution.

No public API change.
