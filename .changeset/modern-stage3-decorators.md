---
'envapt': major
---

**BREAKING.** Modern (TC39 Stage 3) decorators are now the default.

`@Envapt` and the sugar decorators (`@EnvNum`, `@EnvStr`, `@EnvBool`, `@EnvUrl`, `@EnvTime`) imported from `envapt` are now Stage 3 accessor decorators. Decorate with the `accessor` keyword, `static accessor port: number` for a static field and `accessor port!: number` for an instance field. They need no `experimentalDecorators` flag and work on any runtime, including Bun and Deno running `.ts` directly.

The legacy (experimentalDecorators) decorators move to a subpath. Change `import { Envapt } from 'envapt'` to `import { Envapt } from 'envapt/legacy'` to keep the old `static readonly` / `declare readonly` form, which still requires `experimentalDecorators: true`. Everything else (`Envapter`, `Converters`, sources, and types) stays on `envapt`.
