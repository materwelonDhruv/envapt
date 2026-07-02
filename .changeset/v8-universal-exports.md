---
'envapt': major
---

Collapse to one portable build and a single universal `envapt` import, and rename the source classes. Three breaking changes.

1. The source classes drop the `Env` infix. `PortableSource` (was `ManualEnvSource` / `WorkerEnvSource`, which were the same class) is the one source for every runtime without a filesystem. `FileSource` (was `NodeEnvSource`) is the Node source. The `Source` type replaces `EnvSource`. The v7.1 deprecated aliases are removed.

2. `Envapter.fileApiMode` defaults to `'warn'`. On the portable build the file-only config APIs (`envPaths`, `baseDir`, `envFileOptions`, `configureProfiles`, `resetProfiles`) now warn once and no-op by default. Set `Envapter.fileApiMode = 'throw'` to restore the previous throwing behavior. An unconfigured read still throws `NoSourceBound` on first access.

3. The `envapt/workerd` and `envapt/browser` subpaths are removed. Import from `envapt` everywhere. The package exports route Workers, the browser, and the edge runtimes (workerd, edge-light, fastly, worker, browser, react-native) to the portable build, and Node, Bun, and Deno to the node build. The portable types now include the file APIs, so config shared between dev and deploy compiles on every runtime.
