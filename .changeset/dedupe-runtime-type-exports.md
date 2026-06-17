---
'envapt': patch
---

Editor auto-import now suggests each public name once instead of once per runtime build. The published type declarations are emitted as a single shared tree that the Node, Workers, and browser entry points all re-export, so `Envapt`, `Envapter`, the converters, and the rest resolve to one declaration. The Workers and browser entries still expose the portable `Envapter` without the file-only APIs. The package no longer ships the redundant per-runtime declaration trees, so the install is smaller.
