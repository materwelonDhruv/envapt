# envapt

## 4.0.2

### Patch Changes

- 9c7b728: bump versions
- 9c7b728: add examples for each overload of the Envapt decorator

## 4.0.1

### Patch Changes

- bump deps

## 4.0.0

### Major Changes

- **BREAKING:** Simplify exports and type definitions for ESM and CJS. Replaced the nested exports map with flat fields import, require, and default. Types are now only at ./dist/index.d.ts. Removed the build step that renamed index.d.cts to index.d.mts.

## 3.0.2

### Patch Changes

- 063703c: bump deps

## 3.0.1

### Patch Changes

- bump deps and refactor regexes to use String.raw and RegExp obj in BuiltInConverters to avoid disabling eslint rules

## 3.0.0

### Major Changes

- 482eb6d: **BREAKING:** Custom Converters will now execute even if an env variable is not present in the source env file(s). This allows for using `@Envapt` to validate the existence of variables by throwing errors inside the user-defined Custom Converters

### Patch Changes

- 5d1df34: update README to include new things and better navigation

## 2.2.10

### Patch Changes

- remove codecov config

## 2.2.9

### Patch Changes

- b263044: Ensure expected behavior to reject non ISO strings for Date converters
- 953bcb2: Improve test coverage by ignoring unreachable defensive programming blocks
- 8f0722d: Linting for TSDoc
- bc945d4: Safety when attempting to coerce to Symbol
- a21de8c: Augment ImportMeta instead of exporting a method
- dbd99b9: Cleanup files and configure vitest extension

## 2.2.8

### Patch Changes

- e9e359e: Port tests to vitest

## 2.2.7

### Patch Changes

- Fix readme badge for tests CI and make file ext consistent in workflows dir

## 2.2.6

### Patch Changes

- 01b1ba0: Fix deno missing mocha types error by explicitly importing mocha types in test files
- 0be2af4: Better test names and some badge formatting in README. Also condensed NOTICE and the other license file into one NOTICE.md file.

## 2.2.5

### Patch Changes

- 7bb1923: Fixing types and removing `Error.captureStackTrace` to follow ECMAScript specifications

## 2.2.4

### Patch Changes

- 435a738: Add jsr publishing support and a test for the previous version's type-error patch
- f17ca67: Bump deps: @types/node
- 6d47364: Bump deps: @typescript-eslint/parser
- fe12794: Bump deps: typescript-eslint

## 2.2.3

### Patch Changes

- 73162d8: `undefined` as fallback causing type errors when provided with a BuiltIn or Array Converter
- d56fe89: Fix incorrect example in the README for URL converter and add some comments for `@Envapt` overloads

## 2.2.2

### Patch Changes

- 6c1caaa: Fix grammar mistake in README

## 2.2.1

### Patch Changes

- f1c81cc: Make clear that Envapt can be used with JavaScript too

## 2.2.0

### Minor Changes

- a74e97d: Tagged Template resolver for a easily "one-lining" multiple parsed envs in a string literal. It also supports template variables like `${VAR}`! Check README for usage and examples.

### Patch Changes

- c479505: Missing export for `EnvaptError`
- f15ddc9: Fix cache collisions on Envapt used on a static property in one class, and an instance property in another class with the property name being the same for both
- 447aaa4: Fix incorrect "main" export in package.json

## 2.1.1

### Patch Changes

- "boilerplate of parsing" → "boilerplate of transforming parsed" in README

## 2.1.0

### Minor Changes

- Fix missing `.mjs` build

## 2.0.0

### Major Changes

- 7e3a440: Strict Runtime Validation
    - **BREAKING:** Runtime type validation between converter return types and fallback values exists now... and it's strict!
        - But only for built-in and array converters. You are free to do what you want with custom converters.
    - EnvaptError codes actually make sense now instead of the random numbers they were before
    - Added primitive type coercion validation and better error handling

    Since this didn't exist before, it will break existing code that was previously passing incorrect types.

- 7e3a440: Major Type Inference Improvements
    - **BREAKING:** Improved type inference for `@Envapt` decorator with better type safety
        - Fallbacks and Converters are also validated against each other
            - Fallback always decides the type and converter has to match it, except when using a Primitive constructor.
    - Fixed incorrect type inference in **many** cases
    - **BREAKING:** `@Envapt` won't allow you to use its Classic API for any custom converters anymore. Please use the decorator's Modern API, or the Functional API instead.
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
