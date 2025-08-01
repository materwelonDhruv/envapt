---
'envapt': minor
---

## Customize Dotenv Configs

- Change how dotenv loads your env files. (Excludes the `path` and `processEnv` options because Envapter handles those)
  - `Envapter.dotenvConfig` property for setting encoding, debug, override, and other dotenv options
  - Now validates the file paths you provide to ensure they exist
