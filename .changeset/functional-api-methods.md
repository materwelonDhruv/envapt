---
'envapt': minor
---

## New Functional API Methods

- Added `getUsing()` method for using built-in converters functionally
  - Type overrides in `getUsing<T>()` if you need to specify a different type than the converter's inferred return type
- Added `getWith()` method for using custom converter functions functionally
- Functional API actually knows that a value won't be undefined if you pass a fallback value now
