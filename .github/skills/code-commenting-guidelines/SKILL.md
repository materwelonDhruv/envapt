---
name: code-commenting-guidelines
description: Use this when writing, refactoring, or reviewing TypeScript code. Decides whether a comment should exist at all, which is usually no. Covers the code fixes to try first, the four facts a name can never carry, and how a comment should sound once you write one.
---

# Comments

Most code needs none. Fix the code first. When the reason sits outside the file and no name can hold it, write one line the way you would say it out loud.

For _how_ the line should read once you decide to write it, this skill and `writing-voice` both apply. That one covers word choice everywhere. This one covers whether the comment exists.

---

## 1. Try the code first

Try a comment last. Each fix below deletes the comment by making the code say the thing.

### Rename

```ts
// bad
// the running item count
let n = 0;

// good
let itemCount = 0;
```

### Move the words into a function name

```ts
// bad
// a quick tunnel hostname disappears when the process exits, clear the endpoint
if (kind === 'quick') await endpoint.clear();

// good
if (hostnameDiesWithProcess(kind)) await endpoint.clear();
```

The comment became the predicate name. Now it shows up at every call site and the compiler keeps it honest.

### Name the number

```ts
// bad
await wait(4000); // cloudflare needs a moment

// good
const DNS_PROPAGATION_MS = 4000;
await wait(DNS_PROPAGATION_MS);
```

A named constant carries the what. A comment above it can still carry where the number came from, which is section 2.

### Make the wrong call impossible

A comment reading "call `open()` before `stop()`" is a type problem wearing a comment. Return a handle from `open()` that `stop()` requires, and the ordering stops being something a reader has to remember.

Same for "do not pass an empty array here". Take a non-empty tuple type. Same for "only valid after init". Split the type into pre-init and post-init.

### Move the code next to what it explains

Two lines that only make sense together should be adjacent. A comment bridging thirty lines is usually a request to move one of them.

### Split the function

If a block needs a comment to say what it is, that block is a function and the comment is its name.

Once none of these apply, write the comment.

---

## 2. What a name can never carry

Four things. Everything outside this list is a code fix.

**A fact about someone else's system.** Discord, Cloudflare, Node, the browser, a spec, a wire format. You cannot rename your way to "Discord rejects a hostname it already rejected".

**Where an authored number came from.** Any timeout, retry count, threshold, or buffer size someone picked. The constant name says what it is. The comment says why that value and what happens at a different one.

**A workaround.** A bug in a dependency, a language trap, a limit of the type system. Say what breaks without it. The next person needs that to leave it alone.

**An invariant set up somewhere else.** "Sorted by `createdAt` before this point" when the sort happens in a different file. Anything the reader would have to open another file to know.

If your comment is none of these four, go back to section 1.

---

## 3. Sound like a person

Write the sentence you would say to someone sitting next to you at the keyboard. Read it back out loud. If it sounds like a form got filled in, rewrite it.

These are all fine. They are all different.

```ts
// cloudflare publishes the DNS record about 2.5s after the tunnel opens
await wait(SETTLE_MS);
```

```ts
// 240 tries at 250ms covers the 60s a cold edge takes
for (let attempt = 0; attempt < HOSTNAME_ATTEMPTS; attempt++) {
```

```ts
// keep this above the await because the exit handler fires synchronously
child.on('exit', onExit);
```

```ts
// base64 because toString stops at 36
function bigintToBase64(value: bigint): string {
```

```ts
// 4s is the shortest wait that stopped the NXDOMAIN caching. no idea why 2s fails.
const SETTLE_MS = 4000;
```

```ts
// the reverse of this is decodeBody
export function encodeBody(shape: CustomIdShape): string {
```

```ts
// adding a field kind here means adding it to isBounded too
function radixOf(field: CustomIdField<unknown>): bigint {
```

```ts
// node throws process-wide without a listener here
child.on('error', onError);
```

```ts
// discord's docs call this the interactions endpoint
const FIELD = 'interactions_endpoint_url';
```

```ts
// an empty piece means a truncated wire
if (piece === '') throw new InvalidCustomId('empty integer token');
```

Notice the range. Four words to fifteen. Some name a cause. Some name a fact and stop. One admits it does not know why.

### You are allowed to not know

If you measured something and cannot explain it, say that. "4s works, 2s does not, unclear why" is more honest and more useful than a confident guess, and it tells the next reader the number came from a test. A wrong reason stated cleanly is worse than an open question.

### Talk to the next person

A comment can address the reader directly. "if you change this, change X too" is a real comment and often the most useful one on the page. Vary the grammar, sentence structure, and voice in comments, like you would in a conversation.

### Write to the next editor, never to a reviewer

The reader is whoever changes this line six months from now. They want the fact.

A reviewer asking "why is this comment here" is a different person asking a different question. Answering that question inside the comment makes that comment fail its own test and purpose.

---

## 4. Write the fact, then stop

**One fact per comment. Write it, then stop.** That is the default and it covers most comments.

Add a consequence only when a reader would misread the code without it. Usually the consequence is the next line and they are about to read it anyway.

**The test, run it before the comment ships.** Cut everything from the connective onward and read what is left. When the shorter line still does the job, that was the whole comment.

```ts
// drafted
// zero packs to one char, which means an empty block is a truncated body

// cut at the connective, still works, ship this one
// an empty block means the body was truncated
```

Keep both halves when the first carries something the reader has no other way to get. "cloudflare publishes the record 2.5s late" earns its place. "the loop collects failures" does not, because the loop is right there.

**When you catch yourself explaining why the comment is there, delete the comment.** The urge to justify is the tell that it never earned its place. Catch the urge and you catch every version of the shape, whichever connective you reached for.

```ts
// two candidate comments welded together. either half alone would do
// every bot gets Guilds, which is why it is absent below

// two unrelated facts, joined by a connective that implies one follows from the other
// a type test pins these against the real enums, which keeps discord.js out of the build
```

Both were written by someone unsure the comment belonged. The comment on the same page with a hard external fact behind it came out in one clause with no connective at all.

---

## 5. Put it on the line it explains

Attach the comment to the one line whose reason is unclear, on that line or directly above it.

```ts
const BUTTON_STYLE_LINK = 5; // discord's wire value, stable since v8
```

A comment inline gets deleted with its line. A block at the top of a function goes stale as the body changes underneath it, because no sentence in it belongs to any one line.

Keep a block comment only for something the whole function rests on, an invariant every line depends on or a wire format the whole body implements. `packages/envapt/src/infra/StandardSchema.ts:1` is a fair example, because the spec it inlines belongs to the whole module.

Break a multi-clause header into per-line comments. Any clause that only restates its line disappears during the move, which is the point.

---

## 6. TSDoc

A TSDoc block needs a caller who would read the signature and still guess wrong. `export` is not that test.

- Public API gets full sentences and capitals.
- Anything reachable only through a package's `./internal` entry gets a `//` line or nothing. Read the `exports` map in `package.json` to tell.
- `@returns Whether the check passed` next to a declared `boolean` repeats the signature. Delete the tag. When every tag on a block does this, delete the block.
- A tag earns its place by mapping inputs to outcomes the types cannot express, for example which of `undefined`, `true`, and an object produces which result.
- Skip `@internal` on a member when the whole class is already internal. The entry map states it and no consumer reads the tag.

---

## 7. Delete on sight

- Anything restating the line below it.
- `// We do X here because Y`. The next line shows you doing X. Keep the because.
- A comment explaining a type that sits two lines above. Fix the type name.
- Per-overload captions. One block on the implementation signature covers the family.
- Commented-out code.
- A comment naming a symbol that no longer exists. Every refactor leaves these. Grep the names you removed.
- Bug history tied to one incident, unless the incident is the reason the code is shaped that way.

---

## The test

Cover the comment and read the code. Would a careful reader get it wrong?

- No, and a rename would fix it. Do the rename.
- No, it is already clear. Delete the comment.
- Yes, and the missing piece is one of the four in section 2. Keep it, one line, in your own voice.
