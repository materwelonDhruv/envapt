# envapt-nezlephant

Small plugin for envapt to read secrets stored in Nezlephant/OC8 images and plain files.

Usage

- Install: `pnpm add envapt envapt-nezlephant` (or from your fork)

API

- `getNezSecret(key, fallback?, options?)` - helper that reads `nez:` markers from env values and returns decoded secret string.
- `createNezConverter(options?)` - returns a converter function usable with Envapter.

Options

- `marker` (default: `nez:`)
- `baseDir` (default: `process.cwd()`)
- `decoder` (custom decoder signature `(filePath, buffer) => string`)
- `resolveId` (optional) - function `(id) => filePath | null` to resolve `nez:id:...` tokens to actual file paths. This allows external indexers (Rome, etc.) to integrate without adding dependencies here.

Behavior

- If the env value starts with the configured marker (e.g. `nez:`), the plugin either treats the rest as a direct file path or, if it starts with `id:`, will call `resolveId` to get the file path.
- If `resolveId` is not provided and an `id:` token is used, an error is thrown.

Notes

- Keep this plugin minimal and dependency-free. Any advanced indexing or integration should be implemented outside this package (for example in `@funeste38/rome`).
