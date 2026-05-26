---
'envapt': minor
---

new **profiles** support. envapt now auto-loads conventional dotenv-flow files based on the active environment — `.env`, `.env.local`, `.env.${env}`, `.env.${env}.local` (most-specific wins, matches Vite). zero config for the common case.

new `Envapter.configureProfiles({...})` for non-conventional path mappings per environment. configured paths layer on top of the cascade with higher precedence; pass `useDefaults: false` to skip the cascade entirely.

new `Envapter.resetProfiles()` clears any profile / envPaths configuration back to the cascade default. useful in tests.

existing `Envapter.envPaths = '...'` still works as the lowest-level override and takes absolute precedence when explicitly set.
