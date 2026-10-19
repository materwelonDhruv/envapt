---
'envapt': major
---

**BREAKING:** Passing a Standard Schema as the `converter` on `@Envapt`, or as `of` in `Converters.array`, now fails to compile and throws. An arktype type used to run there as a plain function and return its `ArkErrors` object for a bad value. Pass the schema to `@Envapt` as `schema`.
