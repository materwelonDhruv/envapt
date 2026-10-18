---
'envapt': major
---

**BREAKING:** A Standard Schema passed as the `converter` on `@Envapt` now fails to compile and throws `InvalidUserDefinedConfig`, and one passed as the `of` in `Converters.array` fails to compile and throws `InvalidArrayConverterType`. envapt used to call an arktype type in either place as a plain function and return its `ArkErrors` object for a bad value. Pass the schema to `@Envapt` as `schema`.
