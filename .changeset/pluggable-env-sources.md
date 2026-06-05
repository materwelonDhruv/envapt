---
'envapt': minor
---

envapt now runs on the browser and Cloudflare Workers, not only Node. The engine reads variables through a pluggable `EnvSource` instead of reading `process.env` directly, so the same `Envapter` and `@Envapt` API works against an injected object or a Workers binding.

`Envapter.useSource(source)` binds the source; the bound source then backs every read, the `.env` cascade, and `Envapter.syncProcessEnv`. Built-in sources, all exported from `envapt`:

- `NodeEnvSource`: a `process.env` snapshot plus the `.env` cascade. Bound automatically on Node, Bun, and Deno, so you do not call `useSource` yourself.
- `WorkerEnvSource`: reads a Cloudflare Workers `env` binding. Non-string bindings are JSON-stringified so the converters still apply.
- `ManualEnvSource`: reads any object you pass in, snapshotted at construction, with non-string values JSON-stringified like `WorkerEnvSource`. Pass `import.meta.env` or a bundler-injected object directly on the browser, or a plain object in tests.

```ts
import { Envapter, ManualEnvSource } from 'envapt';

Envapter.useSource(new ManualEnvSource({ PORT: '3000', FLAG: 'true' }));
Envapter.getNumber('PORT'); // 3000
```

The core imports no `node:*` module: `node:fs`, `node:path`, `node:process`, and `node:url` are confined to `NodeEnvSource`. envapt ships a build per runtime, so a Workers or browser bundle pulls in no Node built-ins, and workerd needs no `nodejs_compat` flag. Bare `envapt` resolves the right build through the `exports` conditions, and the dedicated `envapt/workerd` and `envapt/browser` entries add the matching types, which omit the file-only APIs so a stray call is a compile error rather than a runtime `FileApiUnsupported`.

Two new `EnvaptErrorCodes` replace silent no-ops with a thrown error:

- `NoSourceBound` (307): thrown on the first read when no source is bound.
- `FileApiUnsupported` (306): thrown when `envPaths`, `baseDir`, or `configureProfiles` is called on a source without a filesystem.

`EnvSource` is a union of `BareEnvSource` (no filesystem) and `FileEnvSource` (which requires `readFile`, `resolvePath`, `normalizeBaseDir`, and `writeVars` together), so a custom source has either the full file API or none of it.

On Node, the `.env` cascade now loads when envapt is first imported rather than on the first variable read.
