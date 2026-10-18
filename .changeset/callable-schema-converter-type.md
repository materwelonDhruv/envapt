---
'envapt': patch
---

Fixed an arktype type passing the type check as an `@Envapt` `converter` or a `Converters.array` `of`, and a callable async schema passing it in `getUsing` or `getRequired`, where each only threw at runtime.
