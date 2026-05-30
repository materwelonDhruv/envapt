---
'envapt': patch
---

Rewrite the README for v5. The package README is now a short, docs-first landing page: hero, the
`process.env` to typed-value pitch, install for npm/pnpm/yarn/bun/Deno (JSR), and one quick start each
for the functional and decorator APIs, with the full reference linked at the docs site. Removes the
stale v4 surface (the old converter enum, `dotenvConfig`, Node `>=22`, "dotenv bundled").
