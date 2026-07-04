---
'envapt': minor
---

Add `merge`, a source combinator that layers several sources with last-wins precedence. It keeps the `.env` cascade and file APIs on one filesystem-backed member, and throws `InvalidMergedSource` with no members or more than one file-backed member.

`useSource` and `merge` also accept a reader function `(key) => string | undefined` as a source, for a runtime that reads one key at a time and cannot list its keys. envapt calls the reader on a cache miss and caches the result.
