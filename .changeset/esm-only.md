---
'envapt': major
---

**BREAKING:** envapt is ESM-only now. the CJS build (`dist/index.cjs`) is gone. if you were using `require('envapt')`, switch to `import` — Node 20+, Bun, and Deno all handle ESM natively. the `exports` map is now a single ESM entry pointing at `dist/index.mjs`.

build pipeline also migrated from `tsup` to `tsdown` under the hood. no user-visible effect beyond the CJS drop.
