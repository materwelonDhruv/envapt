---
name: writing-voice
description: Use this when writing or reviewing any prose - docs, READMEs, code comments, commit messages, PR descriptions, changesets, and chat replies. Defines plain words over compressed abstractions, verbs over invented nouns, a test for anthropomorphism you can apply to any verb, the punctuation bans, and a hype ban-list.
---

# Writing Voice

Write the sentence you would say out loud to another developer. Then check it against the rules below.

This covers everything a human reads. A field description, a `//` comment, a commit body, a changeset, a PR, and a reply in chat all get the same voice.

---

## 1. Plain words beat short words

This is the rule that matters most and the one that gets broken most.

An abstract phrase is shorter than the plain sentence it replaces. Any rule that rewards brevity will pull you toward abstraction. Resist it. **Cut whole ideas. Keep common words.**

A sentence improves when you drop a point the reader did not need. A sentence gets worse when you compress a point into a technical-sounding noun phrase. The second one looks like editing and is the opposite of it.

Real failures, all written by an assistant explaining its own behavior:

<!--prettier-ignore-start-->

| Compressed | Plain |
|---|---|
| local optimum, global monotony | every comment passes on its own. the file reads like one sentence repeated. |
| per-comment conformance | every comment matching the rules |
| the gradient toward variety is zero | nothing pushes toward variety |
| the tails of the distribution | the unusual ones |
| the variance carriers | the things that make writing sound different |
| epistemic posture | how sure the writer sounds |
| uniquely determined by the constraints | the only shape the rules leave |
| rejection criteria | rules about what to cut |
| uniform density | the same number of comments everywhere |
| optimizing against an auditor | writing to pass the check |

<!--prettier-ignore-end-->

Every phrase on the left is shorter. Every phrase on the left costs the reader more.

Those ten are examples of one move, and checking against them catches nothing. Apply the tests below to every phrase you write.

### Three tests

**Say it out loud.** Would you use this phrase talking to someone at a keyboard? "The gradient toward variety is zero" fails. "Nothing pushes toward variety" passes.

**Did you invent the noun?** Two abstract nouns stuck together to name an idea you had thirty seconds ago is jargon, whatever it means. "comment density", "variance carrier", "conformance pressure". Say what happens with a verb.

**Did you borrow it as a picture?** A word carried in from maths, physics, war, or biology to stand for what you mean is a picture, and the reader has to unpack it to get back to the thing. Name the thing.

No list will cover this. Apply the test to every phrase. The question is whether the word already meant this here before you wrote the sentence. Cascade, converter, source, and fallback pass, because they are the real names of real things in this codebase. A word you reached past the domain for does not.

---

## 2. Say it with a verb

A verb turned into a noun makes the sentence longer and vaguer at once, and it usually drags in a weak `is` or `are` to hold it up.

<!--prettier-ignore-start-->

| Noun form | Verb form |
|---|---|
| performs a validation of the payload | validates the payload |
| the deletion of stale rows happens on startup | startup deletes stale rows |
| provides an improvement in readability | is easier to read |
| there is a requirement that callers await this | callers must await this |
| the implementation of retry logic | retries |

<!--prettier-ignore-end-->

Scan a draft for words ending in `-tion`, `-ment`, `-ance`, and `-ility`. Most of them are a verb in hiding. This is Helen Sword's "zombie nouns", and the fix is always to find the verb underneath and use it.

Cut "there is" and "there are" openers. Start with the subject or the verb.

### Lead with who does what

The other way a verb goes missing is a split sentence, where one clause becomes two and the real verb sits behind an `is`. It feels like emphasis while you write it. It costs the reader a whole clause to unpack. Don't write cleft sentences, basically.

<!--prettier-ignore-start-->

| Split | Direct |
|---|---|
| an empty target is what lets the cleanup work | scaffold deletes the directory when a step fails |
| what this does is reset the cache | this resets the cache |
| it is the config that sets the port | the config sets the port |
| the reason it fails is the missing shebang | it fails because the shebang is missing |

<!--prettier-ignore-end-->

---

## 3. Anthropomorphism, with a test you can apply

Code performs no human act. The ban is strict and it keeps leaking, because a word list only catches the words on it.

**The test: could you write that function?** `stop()`, `throws()`, `reads()`, `stores()`, `returns()`. Yes. `land()`, `want()`, `know()`, `see()`, `care()`. No. A verb with no possible implementation is a metaphor, and the metaphor is standing where the mechanism should be.

Real leaks, all of which passed a word-list check:

<!--prettier-ignore-start-->

| Written | Fixed |
|---|---|
| the record lands ~2.5s later | cloudflare publishes the record ~2.5s later |
| the client waits out an exhausted bucket | the client blocks until the rate limit resets |
| abort contains the stop | abort also stops the tunnel |
| a later onPort holds no handle on this tunnel | a later onPort cannot reach this tunnel |
| zigzag keeps a small negative number short | zigzag encodes a small negative number in fewer chars |

<!--prettier-ignore-end-->

The standing swaps:

<!--prettier-ignore-start-->

| Human verb | Mechanical replacement |
|---|---|
| tells / lets | specifies |
| sees / watches | detects |
| knows / remembers | stores, reads, uses |
| wants / needs | requires |
| thinks / assumes / believes | uses, treats as |
| owns | defines, sets, is the only writer of |
| lives in / lands in / sits on | is defined in, is set on |
| handles | parses, coerces, rejects, retries |
| powers / drives / fuels | sets, determines, controls |

<!--prettier-ignore-end-->

### A company is an actor

Discord, Cloudflare, and a browser vendor are people and servers. They do act. "Discord rejects a hostname it already rejected" is correct and precise. "The parser wants a trailing newline" is the banned thing. The line falls between an organization that made a choice and a function that executes one.

> "I have now seen programs 'trying to do things', 'wanting to do things', 'believing things to be true', 'knowing things' etc. Don't be so naive as to believe that this use of language is harmless." Dijkstra, EWD854.

---

## 4. One claim per sentence, then stop

Write the claim and end the sentence. Reach for a second clause only when the reader would get the first one wrong without it.

Before a sentence ships, cut it at the connective and read what is left. When the shorter version still carries the point, that was the sentence.

Prose written to a rule set collapses toward whichever single form satisfies every rule, and the collapse is invisible from inside one sentence. So judge it as a block, a paragraph or a changeset or a file's comments read end to end.

A person writes unevenly. Some sentences land in four words. One runs long because the thing was genuinely hard. One admits uncertainty. That unevenness gives it a natural feel.

Aim for a spread in length, in how sentences open, and in what each one is doing. When two sentences in a row run the same length and turn at the same joint, rewrite one.

---

## 5. State behavior, never sell it

1. Address the reader as "you". Name the thing, and give it no intent.
2. Lead with the action or the plain fact, then the reason.
3. Active voice, present tense. Plain verbs: loads, reads, returns, fails, throws, matches.
4. Say what breaks, flatly. Prisma does this well: "Be aware that this query will fail if the user has any related records."
5. One claim per sentence. Cut the intensifier.
6. Give the condition, never the smoothness. Replace "no manual wiring" with "on a 429 the client waits `Retry-After` seconds before the next attempt".
7. Prefer the concrete noun over the promised benefit. "Throws `TimeoutError` when no response arrives within `timeout` ms" beats any adjective.

Rule of thumb: if an adjective cannot be replaced by a measurable fact or a code reference, delete it.

---

## 6. Punctuation

Em-dash `—` and en-dash `–` are banned in prose. Use a comma, parentheses, a hyphen, or two sentences.

Colon `:` and semicolon `;` are banned as a clause splice, where the mark joins two complete clauses into one sentence. A colon introducing a list, a code block, or a short label is standard. Keep it.

Comma splices are banned. A comma cannot join two complete clauses. Every comma carries a connector after it, separates list items, or becomes a period. Also, prefer to use not-negation over no-negation. "does not throw" is better than "throws no error" for example.

**The comma gets no carve-out.** The colon exemption above covers the colon and nothing else. A comma joining two clauses in parallel shape (`A is X, B is Y`), a two-item enumeration, a pair of contrasting cases, or a before-and-after is still a splice. Matching structure only makes the error easier to miss. If you catch yourself arguing that a particular splice reads fine, that argument is the tell. Rewrite it.

**Fix a splice by rewriting it shorter, in this order.**

1. **Collapse to one clause.** Most splices are one fact stretched over two. This is almost always the best result and the one to try first.
2. **Add the connector that names the real relation** (`because`, `since`, `and`, `then`). Keeps one sentence when both halves genuinely earn their place.
3. **Two sentences.** The fallback when the halves are independent facts that both matter.

Going to a period first produces two stubby sentences carrying what one short line said better.

```ts
// Bad: parallel shape, still a splice
// null is a failed reload, [] is a file that registered nothing
// Good (1): one clause carries it, the empty array needs no gloss
// only a failed reload returns null
```

```ts
// Bad: two facts jammed with a comma
// the cache is keyed by file, a rename lands as a fresh entry
// Good (2): the connector names the relation
// a rename lands as a fresh entry because the cache is keyed by file
```

**Replace a banned mark with punctuation that does the same job.** A `;` or `—` between two complete clauses is holding two thoughts apart, and a bare comma cannot do that. Use a period.

**A connector that claims a cause has to earn it.** Reaching for one to hold a second clause on is how a sentence grows a consequence the reader was about to read anyway. Name the reason for the first clause with `because` or `since`, join two facts with `and`, or end the sentence.

- BAD, invented cause: "it is meaningless without a filesystem and it throws".
- GOOD: "it throws because it is meaningless without a filesystem".
- BAD, stacked: "binds a source per file and restore it after any swap and later tests see a clean default".
- GOOD: "binds a source per file. Tests here swap it, then restore it for a clean default."

### Contrast

State the positive claim on its own. Defining a thing by first naming what it is not costs the reader a rejected idea they then have to discard. This covers "not X, but Y", "X, not Y", "rather than X", "instead of X", and every variant.

- BAD: "the slot is load-bearing, not decoration".
- GOOD: "the slot keeps the ids unique".

When a contrast genuinely carries weight, write two plain sentences.

---

## 7. Ban-list

Illustrative. When a word is missing from the table, apply section 1 and the test at the bottom.

<!--prettier-ignore-start-->

| Banned | Replacement |
|---|---|
| powers / drives / fuels / underpins | determines, controls, sets |
| leverage / utilize | use |
| seamless / effortless / frictionless | delete, or name the condition |
| loud / loudly / fails loudly | name the mechanism: throws `X`, logs a warning, exits non-zero |
| easy / simple / intuitive / fun | delete, or state the steps |
| robust | name the guarantee: validates X, throws on Y |
| performant | give a figure: p99 under 5 ms, O(1) lookup |
| harden / hardening | name the change: make private, remove the export |
| under the hood | internally, or delete |
| out of the box | by default |
| first-class | name the support |
| simply / just | delete |
| in order to | to |
| please / please note | delete |
| enable / unlock / empower | turn on, lets you, you can |
| powerful / flexible / elegant | show the capability |
| notably / clearly / of course / actually / essentially | delete |
| magic / magical | explain the rule |
| reach for X | use X |
| blast radius | name what is affected: every caller of `parse()` |
| rich set of / suite of | list them |
| exercises (a test exercises X) | calls X, runs X, tests X |
| does more than X | state what it does |
| worth noting / surprisingly / you may notice | delete, state the fact |
| good catch / fair point / great question | delete |
| to be honest / frankly | delete |

<!--prettier-ignore-end-->

---

## 8. Rewrites

1. BEFORE: "The same base URL powers every request." AFTER: "The client reads `baseURL` once at construction. Every request method prepends it."
2. BEFORE: "retries failed requests without any manual wiring." AFTER: "The client retries on 429 and 503 up to `retries` times with exponential backoff. Other status codes are returned as-is."
3. BEFORE: "the client seamlessly handles JSON out of the box." AFTER: "If the response `Content-Type` is `application/json`, the client parses the body. Otherwise it returns the raw text."
4. BEFORE: "Our powerful interceptor layer ensures your requests are always robust." AFTER: "If a request interceptor throws, the request is never sent and the error propagates to the caller."
5. BEFORE: "The `@retry` decorator empowers you to effortlessly add resilience." AFTER: "Annotate a method with `@retry(3)` to re-invoke it up to three times on a thrown error. It re-throws the last error if every attempt fails."
6. BEFORE: "Under the hood, the client leverages a smart pool to unlock connection reuse." AFTER: "The client keeps up to `maxSockets` open connections per host and reuses them across requests."

---

## 9. Chat counts

A reply in chat follows every rule above. Section 1 applies hardest here, because explaining something you just worked out is exactly when a compressed abstraction feels earned.

Two or more named things go in a list, never in a prose sentence. Counted things ("all four", "the three internal ones") force the reader to rebuild the set.

Acknowledge in as few words as possible, then go to the content. No opener rating the question, no flag about being honest, no repeating the correction back.

---

## The test

Can a reader predict the exact behavior from this sentence, or do they only get an impression that something was said?

If the sentence only creates an impression, rewrite it as a fact, a step, or a failure mode. If a word in it would make a reader stop and work out what it means, replace it with the plain thing.

Sources: Stripe, Prisma, esbuild, Vue, and Tailwind for reference voice. Google, GitLab, and Microsoft developer style guides plus Wikipedia "Words to watch" for the word bans. Google's anthropomorphism guidance and Dijkstra EWD854. Helen Sword on nominalizations. Clean Code and the Google Python style guide on comments.
