---
'envapt': patch
---

Fixed `getRequiredAll` typing its keys as camelCase when you pass no casing in a project with `strict` off, such as the `tsconfig` Next.js generates.
