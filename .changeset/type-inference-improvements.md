---
'envapt': major
---

## Major Type Inference Improvements

- **BREAKING**: Improved type inference for `@Envapt` decorator with better type safety
  - Fallbacks and Converters are also validated against each other
    - Fallback always decides the type and converter has to match it, except when using a Primitive constructor.
- Fixed incorrect type inference in **many** cases
- **BREAKING**: `@Envapt` won't allow you to use its Classic API for any custom converters anymore. Please use the decorator's Modern API, or the Functional API instead.
  - I updated the overloads for `@Envapt` which fixed most of the type inference issues and also the point above.

Improved type checking may break existing code that was previously passing incorrect types. Typecheck your files after you update pls.

Decorators don't exactly set the value they return to the property they decorate, so the inferred type you see on hover for `@Envapt` will be the type of the converter rather than the type of the property it'll set. Although, for the functional API, the type will be the type of the property it'll set.
