---
'envapt': minor
---

Add `Envapter.syncProcessEnv` opt-in to mirror dotenv-loaded keys back to `process.env`.

- New `Envapter.syncProcessEnv = boolean` (default `false`). Symmetric with `Envapter.strict` / `Envapter.debug`.
- When `true`, after every cache (re)build envapt writes the keys it loaded from `.env` files into the real `process.env`. Only the keys the loader actually wrote into the isolated env are mirrored, so first-wins (`override: false`, default) leaves a pre-existing `process.env` value alone and `envFileOptions.override = true` lets the file value win in both the cache and the mirror.
- Flipping `false` to `true` after the cache is already populated mirrors the existing tracked delta immediately (no cache refresh). Flipping `true` to `false` is one-way: previously mirrored keys remain in `process.env` until the process exits.
- Invalid setter values (non-boolean) throw `EnvaptError(InvalidUserDefinedConfig)`.
- Verbose debug emits per-key `mirrored KEY to process.env` lines plus a summary `mirrored N keys to process.env` after each mirror.
