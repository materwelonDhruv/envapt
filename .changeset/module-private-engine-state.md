---
'envapt': patch
---

Move the engine's mutable state and read cache into a module that the `exports` map does not include. They are no longer fields on the class and have no import path, so outside code cannot read or write them through an `as`-cast or a subclass. Drop the internal `TimeUnit` type and `isStrict()` method from the public exports.
