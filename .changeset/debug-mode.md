---
'envapt': major
---

Add `Envapter.debug` three-level log toggle. Removes the `debug` key from the env-file options object.

- New `Envapter.debug = 'silent' | 'warn' | 'verbose'` (default `silent`). Output goes to stderr prefixed with `[envapt]`.
- New `ENVAPT_DEBUG` env var. Read lazily on first access if the setter was never called; the setter wins after that.
- `warn` level: failed `.env` reads, unresolved `${VAR}` templates (non-strict path), fallback values used in place of missing env.
- `verbose` level: everything in `warn` plus effective `.env` paths during cache rebuild, the cache-cleared notice, per-file key counts, and per-key load lines.
- New `DebugLevel` type re-exported from the package root.
- Invalid setter values throw `EnvaptError(InvalidUserDefinedConfig)` with a list of the accepted levels.
- **Breaking**: the `debug` key on the env-file options object is removed. Use `Envapter.debug = 'verbose'` (or `ENVAPT_DEBUG=verbose`) instead. The corresponding `[dotenv]`-prefixed lines are gone; all debug output now flows through the unified `[envapt]` surface.
