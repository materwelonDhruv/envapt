---
'envapt': minor
---

Add the `Email` and `Port` converters.

`Converters.Email` validates with the WHATWG `input[type=email]` pattern and returns the address unchanged. `Converters.Port` accepts an integer in the `0-65535` range, including `0` for ephemeral binding. Both fall back on invalid input, throw under `getRequired`, and compose inside `Converters.array`.
