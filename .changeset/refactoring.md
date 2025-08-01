---
'envapt': patch
---

## Refactored Some Code

- Envapter went over 400 lines and eslint started crying. It was a sign.
  - It's basically a mixin using inheritance now. Nothing changed for the user though.
- Some Types were removed from the public API because they didn't have any use outside of internal code.
