---
'envapt': patch
---

Fix the documented static decorator convention. A `@Envapt` (or sugar `@EnvNum`/`@EnvStr`/...) field declared as `declare static readonly` reads `undefined` when the consumer compiles with tsc, because tsc emits the decorator against the prototype where a static read never reaches the getter. Static decorated fields now use a plain `static readonly` (no `declare`), and instance fields keep `declare readonly`. The docstrings, README, and examples ship the corrected forms, and a tsc compile-and-run test guards both forms.
