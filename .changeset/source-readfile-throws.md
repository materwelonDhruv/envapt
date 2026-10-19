---
'envapt': major
---

**BREAKING:** Fixed envapt catching an error that a custom source's `readFile` throws while loading `.env` files. The error now reaches your code, where envapt used to skip that file and every one after it.
