---
'envapt': minor
---

Lowered the Node engine floor from `>=24.0.0` to `>=20.0.0`. The Node 24 pin was originally there for `util.parseEnv`, which envapt no longer uses now that the internal `.env` parser ships in `src/Dotenv.ts`. Node 20 LTS users (the bulk of the production ecosystem) can install envapt cleanly again. `bun >=1.3.0` and `deno >=2.5.0` engine floors are unchanged.
