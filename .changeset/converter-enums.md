---
'envapt': minor
---

## Enums for Built-in Converters

- Added `Converters` enum because they look better than string literals and provide better DX
  - Allows using `Converters.String`, `Converters.Number`, etc. instead of string literals
  - Maintains backward compatibility with string literal converter names
