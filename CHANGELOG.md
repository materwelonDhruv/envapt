# envapt

## 2.1.0

### Minor Changes

- Fix missing `.mjs` build

## 2.0.0

### Major Changes

- 7e3a440: Strict Runtime Validation
  - **BREAKING**: Runtime type validation between converter return types and fallback values exists now... and it's strict!
    - But only for built-in and array converters. You are free to do what you want with custom converters.
  - EnvaptError codes actually make sense now instead of the random numbers they were before
  - Added primitive type coercion validation and better error handling

  Since this didn't exist before, it will break existing code that was previously passing incorrect types.

- 7e3a440: Major Type Inference Improvements
  - **BREAKING**: Improved type inference for `@Envapt` decorator with better type safety
    - Fallbacks and Converters are also validated against each other
      - Fallback always decides the type and converter has to match it, except when using a Primitive constructor.
  - Fixed incorrect type inference in **many** cases
  - **BREAKING**: `@Envapt` won't allow you to use its Classic API for any custom converters anymore. Please use the decorator's Modern API, or the Functional API instead.
    - I updated the overloads for `@Envapt` which fixed most of the type inference issues and also the point above.

  Improved type checking may break existing code that was previously passing incorrect types. Typecheck your files after you update pls.

  Decorators don't exactly set the value they return to the property they decorate, so the inferred type you see on hover for `@Envapt` will be the type of the converter rather than the type of the property it'll set. Although, for the functional API, the type will be the type of the property it'll set.

### Minor Changes

- 7e3a440: Enums for Built-in Converters
  - Added `Converters` enum because they look better than string literals and provide better DX
    - Allows using `Converters.String`, `Converters.Number`, etc. instead of string literals
    - Maintains backward compatibility with string literal converter names

- 7e3a440: Customize Dotenv Configs
  - Change how dotenv loads your env files. (Excludes the `path` and `processEnv` options because Envapter handles those)
    - `Envapter.dotenvConfig` property for setting encoding, debug, override, and other dotenv options
    - Now validates the file paths you provide to ensure they exist

- 7e3a440: New Functional API Methods
  - Added `getUsing()` method for using built-in converters functionally
    - Type overrides in `getUsing<T>()` if you need to specify a different type than the converter's inferred return type
  - Added `getWith()` method for using custom converter functions functionally
  - Functional API actually knows that a value won't be undefined if you pass a fallback value now

### Patch Changes

- 7e3a440: Dev and Testing Improvements
  - Coverage for codecov
  - Tests for BigInt and Symbol types
  - Tests for primitive type coercion and multi-line environment variables
  - LOTS more tests I don't remember

- 7e3a440: Refactored Some Code
  - Envapter went over 400 lines and eslint started crying. It was a sign.
    - It's basically a mixin using inheritance now. Nothing changed for the user though.
  - Some Types were removed from the public API because they didn't have any use outside of internal code.

- 7e3a440: Make README.md pretty 🙏🏻
  - Also shorten some scripts in package.json and update files that use these scripts
