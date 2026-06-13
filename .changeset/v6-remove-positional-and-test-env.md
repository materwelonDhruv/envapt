---
"envapt": major
---

Remove the deprecated positional `@Envapt('KEY', fallback, converter)` form. Pass an options object instead, like `@Envapt('KEY', { converter, fallback })`. The no-argument `@Envapt('KEY')` form is unchanged. A second argument that is not an options object now throws `EnvaptError` with `InvalidUserDefinedConfig`, and the internal `InferPrimitiveFallbackType` type is removed.

This major also documents the test-environment detection as an intended part of the API. `NODE_ENV=test` (and Vite's `MODE=test`) resolve to `Environment.Test`, so `isDevelopment` returns false under a test runner. That behavior first shipped by mistake in the 5.2.0 minor, which is deprecated on npm. Pin 5.1.1 for the old behavior, or move to 6.0.0 where it is documented.
