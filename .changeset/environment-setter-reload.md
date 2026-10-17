---
'envapt': patch
---

Fixed reads after `Envapter.environment = 'production'` still returning values from `.env.development` on Node. The setter now reloads the `.env` files for the new environment the way `baseDir` and `envPaths` already did.
