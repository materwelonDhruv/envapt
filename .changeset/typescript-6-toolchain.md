---
'envapt': patch
---

Internal toolchain only. Build, type-check, and lint on TypeScript 6.0, `@seedcord/tsconfig@2`, and `@seedcord/eslint-config@1.4.0`. Trims the `lib` array to what the decorator build uses, removes type assertions made redundant by TS 6.0 inference, and passes `--ignoreConfig` to the portable-build type proof for TS 6.0's new `TS5112`. No public API, type output, or runtime change.
