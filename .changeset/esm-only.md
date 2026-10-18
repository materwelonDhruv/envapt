---
'envapt': major
---

**BREAKING:** envapt is now ESM only, and `require('envapt')` throws `ERR_PACKAGE_PATH_NOT_EXPORTED`. Load it with `import`, or with `await import('envapt')` from CommonJS, and preload the config entry with `node --import envapt/config` in place of `node -r envapt/config`.
