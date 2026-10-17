---
'envapt': major
---

**BREAKING:** Fixed an error from a custom `FileCapableSource`'s `readFile` being swallowed while loading `.env` files. The error now reaches the caller, where envapt used to skip that file and every file after it in the cascade.
