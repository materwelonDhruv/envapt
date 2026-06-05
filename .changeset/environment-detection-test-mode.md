---
'envapt': minor
---

`Envapter` now detects the test environment and reads Vite's `MODE`.

- `Environment.Test` and `Envapter.isTest` are added. `NODE_ENV=test` (and Vite's `MODE=test`) now resolve to `Environment.Test`, where they previously fell through to `Development`. As a result, `isDevelopment` is no longer `true` under a test runner that sets `NODE_ENV=test`.
- `MODE` joins the detection chain, after `ENVIRONMENT`, `ENV`, and `NODE_ENV`. Vite-family browser builds expose `import.meta.env.MODE` but none of the others, so `new ManualEnvSource(import.meta.env)` now sets the environment from `MODE`.
- Environment names match case-insensitively. Previously `staging` was matched case-sensitively, so `STAGING` or `Staging` fell through to `Development`; `production` was already case-insensitive.
- When no environment key is set, or its value is unrecognized, detection defaults to `Development` and emits a debug warning (visible with `Envapter.debug = 'warn'`).
