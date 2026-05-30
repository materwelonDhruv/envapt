---
'envapt': minor
---

Add `Envapter.baseDir` to anchor `.env` resolution to a directory instead of `process.cwd()`. The auto-cascade, `configureProfiles` paths, and relative `envPaths` resolve against it; absolute paths bypass it. It accepts a directory path or a module location: `import.meta.url` / `import.meta.dirname` (ESM) or `__dirname` (CJS). Left unset, paths resolve against `process.cwd()` as before.

This covers monorepos where the process starts from the repository root rather than the package directory, so a package-local `.env` resolves regardless of the working directory.
