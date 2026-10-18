---
name: changeset-guidelines
description: Use this when writing or reviewing a changeset in `.changeset/*.md`. Covers how behavior decides the release type, the opening word for a bug fix, and how much of a mechanism one sentence should carry.
---

# Changesets

A changeset becomes a changelog entry, which someone scans while deciding whether an upgrade breaks their config loading. Get the release type right first, then say what changed once, in the reader's own case.

This skill decides what a changeset says. `writing-voice` covers how any sentence in this repo sounds. `release-version` covers cutting the release itself.

The shape:

- `'envapt': patch`, `minor`, or `major` in the frontmatter. envapt is the only published package.
- One paragraph on one line. No second paragraph, list, heading, quote, or code block.
- At most two sentences for a patch and three otherwise. One sentence is fine when it already carries the reader's own case.

---

## 1. Behavior decides the release type

Ask whether a running app behaves differently after the upgrade. Never ask whether the types still compile.

- A read that now returns a different value, or throws where it used to return, or throws a different `EnvaptErrorCodes` code, is breaking. envapt is past 1.0, so that is a `major`.
- New API that leaves every existing call alone is a `minor`.
- A fix that makes the code do what the docs already said is a `patch`.

A caller that branches on `error.code` changes silently when the code changes. Say so in the entry.

---

## 2. Open with what kind of entry this is

A bug fix opens with `Fixed`. A second fix gets its own changeset.

Why: a changelog gets scanned, so the first word has to say what kind of entry this is. Two fixes in one entry make the reader untangle them.

```md
Fixed `@Envapt({ schema })` throwing `InvalidUserDefinedConfig` for an arktype schema.
```

---

## 3. Write the reader's own case

```txt
BAD: "a schema from some validator libraries"
GOOD: "an arktype schema"
```

Why: the reader matches the entry against their own code. A vague category makes them do that work themselves.

---

## 4. Name the mechanism once

Never list the files or functions it touched.

```txt
BAD: "`Validator.isStandardSchema` and `parseEnvaptOptions` now accept a callable schema"
GOOD: "an arktype schema works on `@Envapt`"
```

Why: a file or function list restates the diff. The reader calls the public API, so describe the change there.

---

## 5. Run cause into effect

Keep a thread between sentences.

```txt
BAD: "A converter field failed. It threw on its own."
GOOD: "A converter field that cannot convert now joins the same error, where it used to throw on its own."
```

Why: splitting every clause to dodge connectors leaves stubs, and the reader has to rebuild the relation you cut out.

---

## 6. Match the connector to the relation

`and` means "also". When the second half replaces the first, use `instead`, `where it used to`, or a fronted `Because ...`.

Why: the wrong connector asserts a relation that is not there.

---

## 7. Mark an illustrative value as illustrative

```txt
BAD: "The error message reads `Validation failed for PORT`."
GOOD: "The message lists every failed key, as in `Validation failed for PORT (could not be converted)`."
```

Why: the real value depends on the reader's config. Stated flat, it reads as the only value.

---

## 8. Stop once the reader can derive the rest

Cut the sentence that spells out a consequence the previous sentence already implies.

---

## 9. Say that it changed

```txt
BAD: "`getRequiredAll` takes a Standard Schema for any field."
GOOD: "`getRequiredAll` now takes a Standard Schema for any field."
```

Read the other changesets in `.changeset/` first and match their tense.

Why: a plain present-tense sentence reads like docs describing how things always worked. A changelog reader scans for what moved, and `now`, `no longer`, or an opener like `Fixed` or `Added` tells them.

---

## Related

- `writing-voice` for word choice and punctuation across every sentence in this repo.
- `release-version` for cutting the release and the pre-mode flows.
