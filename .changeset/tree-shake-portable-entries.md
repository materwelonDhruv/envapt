---
'envapt': patch
---

The `envapt/browser` and `envapt/workerd` builds are now side-effect-free, so a bundler can drop the parts of envapt a consumer never imports. Importing a single export such as `EnvaptError` or `Converters` from the portable builds now ships about 1.3 kB instead of about 22 kB. The filesystem-only APIs (`envPaths`, `baseDir`, `envFileOptions`, `configureProfiles`, `resetProfiles`) still throw `EnvaptError` on the browser and Workers builds, their stubs moved onto the portable `Envapter` class so they install only when that class is used.
