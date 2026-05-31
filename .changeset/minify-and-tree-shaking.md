---
'envapt': patch
---

Minify the published build and mark the package side-effect-free except the `envapt/config` entry. The
`dist` output is now minified (roughly halving the npm install size), and the `sideEffects` field lets
bundlers tree-shake the parts of the surface a consumer does not import. No API or behavior change.
