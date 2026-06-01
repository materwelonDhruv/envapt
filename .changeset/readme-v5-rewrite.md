---
'envapt': patch
---

Rewrite the README for v5. The package README is now a short, docs-first landing page: hero, the
`process.env` to typed-value pitch, install for npm/pnpm/yarn/bun/Deno (JSR), and one quick start each
for the functional and decorator APIs, an agent-skill install line, with the full reference linked at
the docs site. Removes the stale v4 surface (the old converter enum, `dotenvConfig`, Node `>=22`, "dotenv bundled").

Also refresh the npm `description` and `keywords` for registry and search discoverability (adds
`typescript`, `type-safe`, `deno`, `bun`, `zod`, `valibot`, `arktype`, `validation`, `decorator`,
`cross-runtime`, and related terms), and fix the `@Envapt` url-converter `@example` to pass a `URL`
instance for the fallback instead of a string (the previous example would throw at runtime, since the
url converter validates the fallback as `instanceof URL`).
