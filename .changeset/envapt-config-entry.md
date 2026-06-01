---
'envapt': minor
---

Add the `envapt/config` side-effect entry, a drop-in for `dotenv/config`. `import 'envapt/config'` (or `node --import envapt/config`, or `node -r envapt/config` in CommonJS) loads envapt's per-environment `.env` cascade and mirrors every loaded key into `process.env`, with zero dependencies. Also adds `Envapter.load()` to eagerly load the cascade on demand instead of lazily on first read.
