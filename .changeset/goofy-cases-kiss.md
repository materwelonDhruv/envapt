---
'envapt': major
---

**BREAKING:** This should have been done long ago, but all the legacy decorators (`@Envapt` and the sugar decorators) now correctly typecheck the field they are decorating. Say, for example you had `@EnvNum(PORT)` on a field, but the field was typed as `number`, you would now get an error that says `'{ '[envapt] field type must hold the converter output': number | null; }'` because without a fallback, the field would be assigned a `null` value if the environment variable is not set. And of course, this also means completely incorrectly typed fields will also not compile anymore. This was the intended behavior so it should be a minor, but because of how many of my own tests it broke, I'm releasing it as a major.
