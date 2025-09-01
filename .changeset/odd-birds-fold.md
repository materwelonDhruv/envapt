---
'envapt': major
---

BREAKING: Custom Converters will now execute even if an env variable is not present in the source env file(s). This allows for using `@Envapt` to validate the existence of variables by throwing errors inside the user-defined Custom Converters
