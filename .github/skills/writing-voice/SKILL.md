---
name: writing-voice
description: Use this when writing or reviewing any prose in a repo - reference docs, conceptual guides, READMEs, code comments, commit messages, or PR descriptions. Defines a precise, anti-marketing voice - a ban-list of hype words (powers, seamless, loudly, robust, leverage, easy, ...), an anthropomorphism verb-swap, before/after rewrites, worked comment and commit examples, and a one-line test for whether a sentence states a behavior or just sells one.
---

# Writing Voice

A house style for technical prose: word-choice rules, before/after rewrites, and reference examples cited to source. The same rules apply to a field description, a `//` comment, and a commit body.

**Where this applies:** reference docs, conceptual guides, READMEs, code comments, commit messages, and PR descriptions. A commit body that says "massively improves performance" fails the same test as a doc that says "blazing-fast": give the number or name the mechanism.

Reference voices to model: **Stripe** (field descriptions), **esbuild** (imperative how-to), **Prisma** (behavioral facts). For conceptual prose, **React (react.dev)** and **Tailwind** are warmer but stay factual. **Drizzle** and **Astro** show the voice to avoid: "a good friend", "magic", personality in place of fact.

---

## 1. Voice principles

1. **Address the reader as "you"; name the thing, never make it an actor with intent.** Write what _you_ do and what _the value_ is, not what the library "powers" or "empowers." Stripe states facts about the object: "Whether the charge has been disputed."
2. **Lead with the reader's action or the plain fact, then the reason.** esbuild: "Your build command is something you will be running repeatedly, so you will want to automate it." Action first, justification second.
3. **Active voice, present tense, indicative mood.** Plain verbs for behavior: loads, reads, returns, fails, throws, matches. Vue: "Vue automatically detects the change and updates the DOM." Not "will detect", not "is detected by". No "leverages", "harnesses", "drives", "powers".
4. **State constraints and failure modes as bald facts.** Prisma: "Be aware that this query will fail if the user has any related records." This is the biggest tell of good reference docs: they tell you what breaks, flatly.
5. **No anthropomorphizing.** A library is not an agent: it does not "want", "know", "see", "try", "believe", or "power" anything. It specifies, detects, stores, reads, and throws. See the verb-swap below.
6. **One claim per sentence. Cut the intensifier.** Stripe: "Three-letter ISO currency code, in lowercase. Must be a supported currency."
7. **Show the condition precisely instead of selling smoothness.** Replace "without any manual wiring" with the rule: "on a 429 response, the client waits `Retry-After` seconds before the next attempt." Tailwind: "Notice how this class does nothing _unless_ the element is hovered?"
8. **Reassurance is allowed, rarely, and only with a reason.** React: "It takes a bit of practice for it to really stick!" Fine for a conceptual intro; never in API field descriptions.
9. **Prefer the concrete noun over the abstract benefit.** Not "robust error handling" but "throws `TimeoutError` when no response arrives within `timeout` ms." Benefits are inferred from precise behavior, not asserted.
10. **Start each statement with a verb or its subject; cut "there is" / "there are" and throat-clearing openers.** Microsoft: front-load the action so the sentence scans. Not "There is a `timeout` option that controls the deadline" but "The `timeout` option sets the deadline." Prefer a bare imperative over a weak "you can" opener where it reads cleaner: "Use `retry()` to..." over "You can use `retry()` to...".

### Anthropomorphism: swap the human verb for the mechanical one

Google's rule: "Don't attribute human qualities to software or hardware." The fix is mechanical, replace the human verb with what the code actually does.

| Human verb                  | Mechanical replacement |
| --------------------------- | ---------------------- |
| tells / lets                | specifies              |
| sees / watches              | detects                |
| knows / remembers           | stores, reads, uses    |
| wants / needs               | requires               |
| thinks / assumes / believes | uses, treats as        |

> "I think anthropomorphism is the worst of all. I have now seen programs 'trying to do things', 'wanting to do things', 'believing things to be true', 'knowing things' etc. Don't be so naive as to believe that this use of language is harmless." Dijkstra, EWD854.

---

## 2. Ban-list (word/construction → plain replacement)

This list is illustrative, not exhaustive. When a word isn't on it, apply the rule of thumb below and the one-line test at the end.

| Banned                                                              | Why it fails                                                        | Replacement                                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **powers** ("X powers Y")                                           | anthropomorphizes; hides the mechanism                              | "X sets Y" / "Y reads X" / state the relationship                        |
| **drives / fuels / underpins**                                      | same                                                                | "determines", "controls", "sets"                                         |
| **leverage**                                                        | corporate for "use"                                                 | "use"                                                                    |
| **seamless / seamlessly**                                           | unfalsifiable                                                       | delete, or name the condition                                            |
| **effortless / effortlessly**                                       | hype                                                                | delete; show the one step it takes                                       |
| **loud / loudly / fails loudly / throws loudly**                    | intensifier with no measurable meaning; dramatizes the failure      | name the mechanism: "throws `X`", "logs a warning", "exits non-zero"     |
| **easy / easily / simple / intuitive / fun**                        | reader-relative; what's easy for you may not be for them            | delete, or state the steps it takes                                      |
| **without any manual wiring / zero config**                         | sells absence of work                                               | state what happens automatically                                         |
| **robust**                                                          | empty adjective                                                     | name the guarantee: "validates …", "throws on …"                         |
| **performant**                                                      | vague performance claim                                             | a precise figure: "p99 under 5 ms", "O(1) lookup"                        |
| **does more than X**                                                | tease, not information                                              | just state what it does                                                  |
| **under the hood**                                                  | filler                                                              | "internally", or delete                                                  |
| **out of the box**                                                  | filler                                                              | "by default"                                                             |
| **first-class**                                                     | jargon                                                              | name the support: "supports gzip and brotli directly"                    |
| **simply / just**                                                   | minimizes reader effort, often wrong                                | delete                                                                   |
| **in order to**                                                     | wordiness                                                           | "to"                                                                     |
| **utilize**                                                         | pompous for "use"                                                   | "use"                                                                    |
| **please / please note**                                            | filler; never "please note"                                         | delete                                                                   |
| **allow / allows you to**                                           | feature-centric and wordy                                           | "lets you", or rewrite from the reader's side: "You can …"               |
| **enable** (= make available)                                       | vague; reserve for feature flags and security                       | "turn on"                                                                |
| **unlock / enable you to**                                          | hype                                                                | "lets you" / "you can"                                                   |
| **empower / supercharge / blazing-fast / lightning**                | pure marketing                                                      | delete; if speed matters, give a number                                  |
| **powerful / flexible / elegant**                                   | self-praise                                                         | show the capability instead                                              |
| **notably / clearly / of course / actually / essentially**          | editorializing; tells the reader how to feel                        | delete                                                                   |
| **"some say" / "it is believed" / "research shows"** (unattributed) | weasel; implies a claim without making one                          | name the source, or delete                                               |
| **handle / handling** (vague)                                       | hides behavior                                                      | name the action: "parses", "coerces", "rejects"                          |
| **rich set of / suite of**                                          | brochure                                                            | "a set of", or just list them                                            |
| **magic / magical**                                                 | mystifies behavior                                                  | explain the rule                                                         |
| **reach for X**                                                     | folksy filler for "use"                                             | "use X", or name the action                                              |
| **blast radius**                                                    | war metaphor for scope of impact; dramatizes it                     | name what's affected: "every caller of `parse()`", "all rows in `users`" |
| **lives in / lives on**                                             | folksy for where something is defined; anthropomorphizes a location | "is defined in", "is set on", name the file or element                   |
| **owns**                                                            | anthropomorphizes; a module isn't an agent with property            | name the relationship: "defines", "sets", "is the only writer of"        |

Rule of thumb: **if an adjective can't be replaced by a measurable fact or a code reference, delete it.**

### Banned punctuation

The em-dash `—` and en-dash `–` are banned in prose outright, replace them with a hyphen, a comma, parentheses, or two sentences. The colon `:` and semicolon `;` are banned only as a **clause splice**, where the mark joins two independent clauses into one sentence (the AI-prose tell, two thoughts packed behind a mark instead of ended with a period). A colon that introduces a list, a code block, an enumeration, or a short label (a `two forms:` lead-in, an `npm: envapt` label) is standard and clearer than a period there, so keep it and do not flatten it. A semicolon in running prose is almost always a splice, so avoid it, its one legitimate use is separating list items that already contain commas. This is a prose rule only. Code syntax that requires a colon or semicolon (type annotations, object keys, statement terminators) is exempt.

```ts
// Bad: colon splice + semicolon splice
// turn the value into its slot: out of range would corrupt neighbours; check first.
// Good: one fact, plain comma
// out of range would carry into the neighbouring field on decode.
```

---

## 3. BEFORE → AFTER rewrites

The running example is a generic HTTP client. Substitute your own domain; the transformation is the point.

1. BEFORE: "The same base URL POWERS every request, interceptor, and retry helper."
   AFTER: "The client reads `baseURL` once at construction. Every request method prepends it; pass the `url` option to override it per call." (Prisma)
2. BEFORE: "A default header does MORE THAN set a value."
   AFTER: "A default header is sent on every request unless the per-call `headers` option overrides that key." (Stripe)
3. BEFORE: "retries failed requests WITHOUT ANY MANUAL WIRING."
   AFTER: "The client retries on 429 and 503 up to `retries` times with exponential backoff. Other status codes are returned as-is." (esbuild)
4. BEFORE: "the client seamlessly handles JSON out of the box."
   AFTER: "If the response `Content-Type` is `application/json`, the client parses the body and returns the parsed value. Otherwise it returns the raw text." (Vue)
5. BEFORE: "Our powerful interceptor layer ensures your requests are always robust."
   AFTER: "If a request interceptor throws, the request is never sent and the error propagates to the caller." (Prisma)
6. BEFORE: "The `@retry` decorator empowers you to effortlessly add resilience to any method."
   AFTER: "Annotate a method with `@retry(3)` to re-invoke it up to three times on a thrown error. It re-throws the last error if every attempt fails." (esbuild)
7. BEFORE: "Under the hood, the client leverages a smart pool to unlock connection reuse."
   AFTER: "The client keeps up to `maxSockets` open connections per host and reuses them across requests." (Vue)
8. BEFORE: "Helper methods like `client.json()` give you a first-class, blazing-fast developer experience."
   AFTER: "`client.json(url)` is shorthand for `client.get(url)` followed by `.json()` on the response. It returns the parsed body." (Stripe)
9. BEFORE: "the client simply works with your existing setup, just drop it in."
   AFTER: "The client reads proxy settings from `HTTP_PROXY` and `NO_PROXY`, so it respects the same environment your shell already uses." (Prisma)
10. BEFORE: "A rich set of built-in adapters lets you handle any transport with ease."
    AFTER: "The client ships adapters for `fetch`, `XMLHttpRequest`, and Node's `http`/`https`. You can register your own adapter." (esbuild/Stripe)

---

## 4. Comments follow the same voice

A code comment is prose; every rule above applies to it. The most common comment-voice failure is the intensifier dressed up as information: `loudly`, `aggressively`, `properly`. State the mechanism instead.

```ts
// Bad: intensifier + dramatized failure
// Validate the payload and fail loudly so callers notice.
// Good: name what is thrown and who catches it
// Throws `ValidationError` on the first invalid field; the route handler catches it.
```

```ts
// Bad: "powers" hides the mechanism
// This flag powers the entire retry subsystem.
// Good: state the effect
// When false, `request()` skips the retry loop and returns the first response.
```

```ts
// Bad: anthropomorphized ("wants")
// The parser wants a trailing newline here.
// Good: state the requirement
// The parser requires a trailing newline to terminate the last record.
```

```ts
// Bad: "loudly" + "magic"
// Logs loudly when the cache magically warms itself.
// Good
// Logs a warning via `logger.warn` on the first miss after a cold start.
```

This skill governs how a comment reads once you've decided to write it. For whether a comment is warranted at all (density, placement, when it's noise), see the `code-commenting-guidelines` skill. The two compose: that one decides _if_, this one decides _how_.

---

## 5. Commit and PR voice

A PR description is prose: the full ban-list and every principle above apply, no hype, no narrating the diff. Commit _subjects_ add one rule on top: **imperative mood**.

- **The test (cbeams):** a subject must complete the sentence "If applied, this commit will \_\_\_." "Add", "Fix", "Drop", "Rename" pass; "Added", "Fixes", "Changing", and noun phrases like "Sweet new API methods" fail.
- **The Conventional Commits type prefix is orthogonal to mood.** `feat: add retry backoff`, not `feat: adds retry backoff` and not `feat: blazing-fast retries`.
- **Bodies state what changed and why, plainly.** The reasons, the old behavior and what was wrong with it, the new behavior. The diff already shows the how.

Bad → good subjects:

- "Fixed bug with retries" → "Fix retry loop hang on an empty 503 body"
- "Massive perf win on the hot path" → "Cache compiled regexes to avoid recompiling per call"
- "Sweet new API methods" → "Add list and get methods to the Widgets API"
- "Changing behavior of parse()" → "Make parse() reject negative offsets"

---

## 6. Verbatim target-voice sentences (tuning forks)

### Docs and API prose

1. Stripe, flat field fact: "If the charge was created without capturing, this Boolean represents whether it is still uncaptured or has since been captured." <https://docs.stripe.com/api/charges/object>
2. Prisma, failure as a bald fact: "Be aware that this query will fail if the user has any related records (such as posts)." <https://www.prisma.io/docs/orm/prisma-client/queries/crud>
3. esbuild, imperative how-to with the exact constraint: "If you are bundling code that will be run in node, you should configure the `platform` setting by passing `--platform=node` to esbuild." <https://esbuild.github.io/getting-started/>
4. Tailwind, names the precise condition: "Notice how this class does nothing _unless_ the element is hovered?" <https://tailwindcss.com/docs/styling-with-utility-classes>
5. Vue, present-tense mechanism: "When you use a ref in a template, and change the ref's value later, Vue automatically detects the change and updates the DOM accordingly." <https://vuejs.org/guide/essentials/reactivity-fundamentals.html>

### Comments and commits

1. Clean Code (Martin), on redundant comments: "Redundant comments are just places to collect lies and misinformation." <https://www.goodreads.com/quotes/909630-redundant-comments-are-just-places-to-collect-lies-and-misinformation>
2. Google Python style guide, on what a comment is for: "never describe the code. Assume the person reading the code knows the language (though not what you're trying to do) better than you do." <https://google.github.io/styleguide/pyguide.html>
3. cbeams, on commit subjects: "A properly formed Git commit subject line should always be able to complete the following sentence: If applied, this commit will _your subject line here_." <https://cbea.ms/git-commit/>

---

## One-line test for any sentence

Can a reader predict the exact behavior from this sentence, or are they just being told it's good? If the latter, rewrite it as a fact, a step, or a failure mode. A sharper variant for the subtle cases: does the word only create an impression that something was said (weasel, puffery), or does it assign a human act to code (anthropomorphism)? If so, cut it.

Sources: Tailwind, React, Vite, Prisma, esbuild, Stripe, Vue (voice models); the Google, GitLab, and Microsoft developer style guides and Wikipedia "Words to watch" (word bans); Google's anthropomorphism page and Dijkstra's EWD854 (anthropomorphism); Clean Code, the Google Python style guide, and the cbeams / Angular commit conventions (comments and commits). Drizzle and Astro rejected as too marketing-voiced.
