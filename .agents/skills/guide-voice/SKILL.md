---
name: guide-voice
description: Use this when writing or reviewing a page of the envapt guide, anything under apps/guide/content. Covers how a page explains why the library is shaped the way it is, how it talks to the reader, the sentence rhythm it needs, and the two review passes a page runs before anyone reads it.
---

# Guide voice

A guide page teaches. Someone reads it on purpose, having chosen to spend their afternoon getting typed config into their app, and they can leave at any point. That reader wants two things from every page: what to type, and why it is shaped that way.

The worked examples below come from the seedcord guide, a Discord framework by the same maintainer, which went through these reviews first. The rules they illustrate apply here unchanged. Swap in an envapt example when you meet a good one.

This skill sits on top of [`writing-voice`](../writing-voice/SKILL.md), which still applies in full. Plain words over compressed abstractions, a verb in place of an invented noun, the anthropomorphism test, the punctuation bans, and the ban-list all hold here.

Three rules in it change on a guide page, and every change is stated where it applies.

1. **One claim per sentence, cut at the connective.** Right for a comment, a changeset, and a commit. On a guide page it deletes the reason, because a reason attaches at a connective by construction. Effective Go reads "This rule arises because pointer methods can modify the receiver," and cutting at the connective leaves half of it.
2. **`and` as a splice repair.** `writing-voice` lists it among the connectors that name a real relation. On a guide page `and` leaves the relation unstated, so the prose review reads every connector against the relation it promises and the writer picks the one that says how the halves relate.
3. **Present tense for everything.** Right for behavior, which is most of a page. A complaint the page's feature takes away belongs in past tense, since that is what tells the reader it is over. Section 1 has the test.

---

## 1. Three kinds of why which should go in different places

**A reason that names a mechanism goes on the page, beside the thing it explains.** One or two sentences. This is most of them. Real one, from the pagination page:

> Every button carries its target page inside the custom id, so a click still works after your bot restarts.

**Every feature says what it is for, at the top of the section that teaches it.** One or two sentences naming what the reader does without it and what that costs them. This covers every feature in the guide, and the five arguments below are the few that need more than a paragraph.

A section opening on how to configure a thing tells a reader who already wanted it how to get it. It tells everyone else nothing, and everyone else is most of them.

The emoji section opened on "Name each custom emoji in your config, then read it back by that name", which tells someone already sold on the feature how to use it. What went in above it is the work they are doing today:

> You've gone hunting for an emoji id before. Copy `<:streak_flame:1872389747982323426>` out of the client, paste it into a constants file, then do the next one. From then on you keep that file in sync by hand.
>
> A re-upload gives the emoji a new id, so every copy of the old one points at nothing. A rename leaves the name in your code out of step with the one in Discord.

Write it as the thing they have already done, in the words they would use for it. The maintainer's note on the first attempt, which stated the same facts flatly: the reader has to recognise themselves in it.

Ground every cost you name. A re-upload really does mint a new id. A rename leaves a hardcoded id working, so the cost there is a stale label, and claiming a broken message would be overclaiming.

Ground it in the guide or in the code, never in what you remember about another library. A commands-tab opener claimed plain discord.js splits a command across two places, and discord.js's own guide puts the builder and the `execute` function in one file. The claim collapsed the moment anyone opened the source, and an opener that gets a reader's daily tool wrong costs more than no opener at all.

**Write the complaint flat.** The reader already has the problem, so a conditional hands it back to them as a suggestion. "You'd write your own wording onto that card" reads as advice. "The wording on that card is yours to replace" states what is true. Reserve `would` and `might` for a case the reader may never hit.

**Name who does the failing.** The library is the only name on the page, so a complaint with nobody in front of the verb gets read as its doing, and the page opens by blaming the library for the thing it is about to fix. "A second reply on the same interaction comes back rejected" says who did the rejecting, which is Discord, and the ack-states page read as though seedcord turned the reply away. Hand the verb to whoever acts: Discord, the reader's own code, the reader. Where the mistake is the reader's, `if` says so, as in "If you get the reply order wrong, the call fails."

**Say whether the complaint is over, in the tense.** A complaint in flat present reads as the way things simply are, so the reader gets to the end of it without knowing whether this page fixes the thing or teaches them to live with it. They find out one paragraph later, which is a paragraph too late. Where the feature takes the complaint away, write it in past tense and let the flip back to present be the answer arriving. The options page ran "`getString('query')` still handed back `string | null`. Every read opened with a check whose answer you already knew", answered by "Every option you declare becomes a getter on `this.options`".

The test is whether the reader still lives with it after this page. Discord still allows three seconds, still hands a click back as one string, still lists commands flat. Those stay in present, because past tense would promise a fix nobody is shipping.

A frame word does the same job, and about twenty openers use one: `by hand`, `yourself`, `Without`, `With plain discord.js`, or an `if` that makes the sentence a hypothetical. An opener with neither a frame nor a past tense is the one to look at.

Then leave the rest of the paragraph alone. The first repair cut that complaint down to a line, which fixed the actor and threw away the reason anyone would read on. A misaimed complaint is aimed again at full length.

**Then answer the problem in the next breath.** A why-paragraph opens a new seam in the section, between the work the reader does today and the line telling them what to type. The first words after that break point back at the complaint. "Some emojis come from your app and some from one guild, so each of those is its own lookup" is answered by "seedcord does those lookups for you", where the repeated noun is what carries the reader across. The first draft of that section ended the problem and opened the next paragraph on "Name each custom emoji in your config", which leaves the reader to make the join themselves. The maintainer caught it as a failure mode of its own.

Test: read a section's first paragraph and ask what the reader would be doing without this feature. Where the section never says, it never argued for the feature at all.

**Teach the judgment that comes with the surface, where there is one.** This guide teaches someone to use envapt and to load config well with it. Once a reader has a surface in hand they face a call: where the code goes, which of two shapes fits, what today's choice costs them later. A page that answers only "how do I type this" leaves them to find that out in production.

Two tests before a line of judgment goes in.

1. Would a reader who skipped it write something they later regret, in a way specific to this surface? General advice about small functions and clear names belongs in someone else's book.
2. Can you name the cost in their terms, with a mechanism behind it?

Both real ones in the guide pass on the same shape, a specific surface and a specific cost:

<!-- two separate quotes, so the blank line between them is deliberate -->
<!-- markdownlint-disable MD028 -->

> Keep that declaration in the file with the component that encodes it. Both sides read the field names off one `CustomId`, so a rename cannot reach one and miss the other.

> Make that call in the constructor anyway. `this.instance` is protected to keep a ban card's whole description in one file.

<!-- markdownlint-enable MD028 -->

A paragraph is the size of this. Advice that grows a heading of its own has become a page about advice, and the reader came for the surface. A reference table, a flag list, and a troubleshooting page each answer a question the reader already arrived with, so none of them wants this.

**An argument about why the library has this shape at all goes on the page that teaches the thing**, as a paragraph, near the top, before the reader has typed anything.

envapt asks a reader to do four things that need defending:

1. Read config through `Envapter` or a decorator, in place of `process.env`.
2. Declare a decorated field with the `accessor` keyword, or turn on `experimentalDecorators` for `envapt/legacy`.
3. Bind a source with `useSource` before the first read on Workers, the browser, and edge runtimes.
4. Keep a Standard Schema synchronous.

Each gets argued once, on the page that teaches it. Whoever sends the content review fills in which argument the page under review is responsible for, and the review reports whether the page carries it.

This skill sets no page template. A page carries whatever headings its content needs.

### The shape an argument takes

Four beats, from Effective Go. State the rule. Attach the mechanical reason. Name the consequence. Disclose the cost or the exception on the spot rather than saving it for a callout further down.

The codegen page carries this one. What shipped, spread over the top of the page with a sample between the first two beats:

> An option's name and its required flag are arguments to method calls. Those calls run when something constructs the class. TypeScript reads the source of that chain without running it, so the name `query` only exists once the chain has run.
>
> `seedcord codegen` records those names for you. It imports every `.ts` and `.js` file under your commands folder, constructs each decorated class it finds, reads the JSON that class's builder produced, and writes what it found to `seedcord-gen.d.ts`.
>
> Your handler then reads its options through `this.options`. `getString('query')` comes back as `string`, because you marked that option required. A typo in the name stops the build.
>
> The cost is a generated file you commit.

The reason runs ahead of the rule there. Both orders work, since what the four beats settle is that all four appear and that the cost appears with them.

Ground every beat before you write it. The first draft said codegen "reads those files", which reads as static parsing and is wrong. Codegen imports each command file and executes it, and that is the fact that explains why a separate step exists rather than a compiler plugin. The same draft priced the cost as "a file you rerun and commit", where you rerun the command.

### Read the sample, never write beside it

After a fence, point at something in it. Name a value, a line, a token the reader can go and look at. The codegen page does this with one word:

> TypeScript reads the source of that chain without running it, so the name `query` only exists once the chain has run.

`query` is in the fence above that sentence. The reader looks up, finds it, and the claim lands on code they just read.

The failure is a sentence that states a true general fact beside a fence and never enters it. The components page ran three paragraphs of those and read as a wall of instructions, because every sentence would have been just as true with no fence on the page at all.

Test: could this paragraph sit under a different sample without changing a word? Then it is written beside the code rather than about it.

The sentence saying what a sample's code does goes right after the fence too, where the reader can find what it names. Before the fence keep only the rule or the question the sample answers.

The same holds for a hand-written version set against a sample. The custom-ids page showed `ticket:123:close` beside a declaration carrying three fields, so the comparison hid the cost it was there to show. `ticket:184580573574955008:close:true` carries all three, and the reader sees every value come back as text.

### A forced decision argues differently from a chosen one

Codegen is forced. TypeScript cannot evaluate a builder call, so the page shows the wall, names the tool that gets past it, and states the cost. The reader had no choice to make.

Subclassing a component base is a choice. Nothing stops anyone building a `ContainerBuilder` inline in a handler. A page covering that kind of decision earns it instead of asserting it:

1. Name the moment the reader is in, with the code they already write.
2. Name the decision they are making.
3. Say what the choice does to their code, in their terms, and carry it to the payoff. "You edit `BanCard.ts` once" is the mechanism and it stops one beat short. "To reword the card, you change one line in `BanCard.ts`. Every handler that sends one gets the new wording" is the same fact taken as far as the reader cares about.

    Reach for the fact, never a scene. An invented moment, a made-up timescale, a hypothetical afternoon six months out, all of that is a rhetorical shape wearing a payoff.

4. Name what it costs.
5. Say when to skip it.

A list of the design's good properties skips all five and reads as marketing. Three true sentences about what a base class gives you leave the reader with no reason to want any of it.

### Say what was declined

An argument is worth more when it names the alternative that lost and why.

The route being written twice, once in the decorator and once in the generic, is the clearest case. A form that writes it once was built and measured, and it was declined for v1 because a call in an `extends` clause reads as mixin machinery and go-to-definition lands on a synthesized base. Assert types check that the pair agrees. A reader who wondered why they type the route twice now has their answer.

Never invent one. Where no alternative was weighed, state the reason and stop.

### Set up the problem before naming the mechanism

The Rust Book's ownership chapter builds a problem the reader can feel across several sections before the rule falls out as the answer. A guide page has less room, and a few sentences usually do it. Real one, from the effect-gates page:

> Say a command costs one credit. Your gate reads the balance and deducts one. A later gate then refuses. The command never ran, and the caller lost a credit anyway.

A sentence that sets up a problem the section then solves does not state a fact of its own, and it is doing a job. The prose review is told to leave it alone.

---

## 2. Talking to the reader

### Contractions

Use them. `doesn't`, `you'll`, `it's`, `won't`, `don't`. Google, Microsoft, and GitLab each recommend them by name, and Google's reason for the negated ones is that a scanning reader misses `not` and cannot misread `don't`.

No quota, and no need to force one into a sentence that reads better without it. This rule exists because most pages in the guide once had zero.

Skip the nonstandard ones. No `guides're`, no three-word forms like `mightn't've`.

### Second person

`you` is the default subject for anything the reader does. On a page where the reader is doing something and can fail, most sentences address them directly, which is where Django's tutorial and Rust's early chapters sit. A reference table runs much lower and that is correct.

A page that teaches a hard idea and never says `you` is the failure. It has happened here, on a page whose motivating example is one of the best in the guide and which addressed the reader once in three paragraphs.

### `we` and `I`

`we` covers the reader and the guide together. "In the next section we'll add a gate."

`I` stays in the blog, where one person explains what they built and why. No docs page gains an `I`.

### Question headings

A heading may ask a question where the section answers one. Every heading on Go's FAQ is a question, and Diátaxis says a real or imagined why question is the right prompt for an argument.

A heading that picks for the reader stays banned. `How to pick` covers both options and `Pick gateway if...` decides for them.

### Warmth, and where it goes

Warmth goes two places. At a seam, meaning a page opening, a line under a heading, or a page ending. And next to a failure, meaning a broken sample, a trap, or something the reader is about to get wrong.

The second one is where the best lines in the model guides sit. Rust writes "Try the code in Listing 4-6. Spoiler alert: It doesn't work!" directly above a block that fails to compile. Django writes "Wait a minute." above output that is unhelpful. Both are mid-page, both are body prose, and both are the most useful sentences on their page.

It comes off a reference table and off a page stating policy. Django's design-philosophies page carries none at all.

Keep it to a few words. The move is to flag a coming failure and hand the reader forward, so a version that takes three sentences to arrive has the right instinct and the wrong length.

**Cringe stays banned.** A joke, a wink, an exclamation mark, and a sentence performing enthusiasm all read worse than the flat version. Google says to avoid humour, because most of it does not survive a reader who learned English second. What does survive that reader is a plainly stated complaint about a real annoyance. Rust's "It's quite annoying that anything we pass in also needs to be passed back" does the work without a joke in it.

---

## 3. Reasons, consequences, and rhythm

### `because` for a reason, `so` for a consequence

A `so` clause states a consequence that follows from a mechanism. A `because` clause gives the reason for a claim. They point opposite ways, and the guide has reached for `so` roughly twenty times for every `because`.

A consequence, where `so` is right:

> Codegen writes the declarations, so a typo in an option name stops the build.

A reason, where `because` is right:

> The route is written twice because the decorator and the generic are separate declarations, and assert types check the pair.

`since` works for a reason too. `though` carries a concession. The prose review counts all of them, and one connector carrying most of a page is the defect whichever word it is.

### Sentence spread

A person writes unevenly. Aim for a range on every page:

- At least one sentence past 22 words, where the thing was genuinely hard.
- Several under 8.
- No run of three consecutive sentences under 8 words.
- A one-word sentence is a deliberate beat, at most one per page.

The ceiling and the floor both exist because both failures have happened here. A page of long clause-stacked sentences is the first draft. A page of short declaratives back to back is what the fix produces when every comma becomes a period, and it reads worse. Google's only number is under 26 words per sentence, which caps one sentence rather than setting a target for all of them.

### Vary what replaces a connector

Cutting `, so` at the comma leaves two stubby sentences, and doing it eight times leaves a page of them. The repairs, in rough order of preference:

1. One clause absorbs the other.
2. `because` or `since` opens the second half.
3. A relative clause.
4. A fronted participle.
5. A concessive `though`.
6. A period.

Read the paragraph after each fix. Never the sentence.

---

## 4. What goes wrong

Seventeen shapes, drawn from real corrections. Judge whether a sentence does the same thing, however it is worded.

**Refer to one by its name, never its number.** A reviewer reports a finding by name, so a renumbering cannot make a report point at the wrong rule. The worked example for each lives in the review prompt that enforces it, and the numbers here match the prose review's.

The prose review covers these fourteen. It reads the page and nothing else.

1. **A sentence about the page instead of a sentence with a fact.** A line restating its heading. Announcing a list and not delivering one. Test: delete the first sentence under a heading and see whether anything is lost. A line naming what a fence shows survives that test, and so does a sentence setting up a problem the section then solves.

    Deleting the sentence is not always the repair, because it usually answers a real question, such as "when do I use this page instead of that one" or "who is this for". Work out that question, then answer it with a fact about the library or the content: "Come here for an exact signature, an overload, or an option you half remember" becomes "Each entry lists the signature, every overload, and each option's default." A routing job goes in the link text, as in "For when to use each piece, see the [guide](/docs)". Where the content already answers the question, delete the sentence.

2. **Overclaiming, or a reason that does not hold.** `Everything`, `always`, `never` where the truth is narrower. A list of three reading as the complete set. A because-clause that falls apart when you check it, which is worse than giving no reason at all, because the reader takes it as settled. Also any count a non-breaking release could change, and any promise about future releases the project does not make. An opener and a first sample that read as the whole surface count too. The modals page opened on text and showed one text input, so a reader stopped there thinking a modal holds only text.
3. **Explaining what the reader already knows.** Defending why a requirement is a requirement. Spelling out a consequence that is the next sentence anyway. An argument for the design is never this finding. The same shape runs at page scale, where a paragraph says what a later heading is for. A why added to the top of the hot-reload page announced which saves need a restart, which is what the paragraph below it closes on and what a heading further down covers in full. Read a new paragraph against the headings under it before it ships.
4. **A rhetorical shape standing in for the thing.** Verbless fragments as beats. Wordplay. Any sentence that would be shorter and clearer said plainly.
5. **Written from the library's side instead of the reader's.** The deepest one, and it comes from writing what envapt does before asking what the reader is trying to build. In the seedcord guide, the gates page once led with the catalog the framework ships, where the point is that you write your own.
6. **Content that does not earn its space.** An error a reader will rarely hit. Anything that does not serve the one thing this page is for. An argument the page is responsible for under section 1 always earns its space.
7. **A claim about behavior with the value left out.** The sentence says something happens and omits the argument, the type, the default, or the option set. "Call it yourself to widen that" hands the reader a task they cannot finish. A claim that grew to cover more cases and lost its values counts too, and widening needs a table. So does a sentence saying what a surface lacks without saying where the reader gets it, and a number the reader matches in code written without the name they would type, like 10062 without `UnknownInteraction`.
8. **An example picked because it was available to name.** A section covering a surface nobody reaches for, with whichever member the writer could name first inside it. A one-line fact wearing a callout.
9. **One phrasing carrying every cross-reference.** A guide is mostly links to other pages, and one shape for all of them turns the whole thing into a chant. Fold the link into a noun the sentence already has, or verb the link, or give the other page a verb that fits what it does.
10. **A requirement on the author written as behavior.** A sentence describing what a symbol does reads as automatic. Where the author writes it by hand, the reader waits for something the framework never does. The repair names the obligation and what enforces it.
11. **A rule with the reason left out.** The page says to do something a certain way and never says what goes wrong otherwise. A recommendation hedged with no criterion the reader can apply. A style preference welded to an unrelated mechanism, so the mechanism reads as the reason for the preference.
12. **Inline code long enough to hold a line open.** Backticks do not wrap, so a full error message or a chained expression pushes past the column on a narrow screen.
13. **Prose that runs beside a sample without reading it.** After a fence, the paragraph points at something in it, a value, a line, a token the reader can go and look at. Could it sit under a different sample unchanged? Then it is written beside the code. Section 1 has the worked example.
14. **A design presented as a list of its good properties.** Where a page asks the reader to adopt a shape nothing forces on them, a run of sentences each naming one nice thing about that shape reads as marketing. The five beats under "A forced decision argues differently from a chosen one" are the repair. A page covering something the framework forces is exempt.

The content review covers these three, plus everything in section 7. It opens the declarations.

<!-- the numbering continues the list above, since a reviewer cites a shape by its number -->
<!-- markdownlint-disable MD029 -->

15. **A way of using the surface the page never shows.** Read every declaration whole, including the variadic parameters, the overloads, the optional arguments, and the generic bounds. Each distinct form appears once. This settles at a different level from the example rule above, which decides how deep one member goes where this one decides which forms appear at all.
16. **An optional parameter or field stated flatly.** A parameter read as required costs the reader an argument they never needed. A field read as always present costs them a guard they skipped. The reverse counts too.
17. **A feature taught with no reason to exist.** The section says how to turn the thing on and never says what the reader does without it. Read the section's opening and name what it would cost someone to go without the feature, sourced from the code and from what the platform requires.

<!-- markdownlint-enable MD029 -->

---

## 5. The loop

Run these one at a time and apply each pass's fixes before starting the next. Each pass has to read the sentences the pass before it wrote, since those are the ones nothing has checked.

1. Answer the four questions in section 6.
2. Read `apps/guide/mdx-components.tsx` for the elements a page can use (the Fumadocs defaults, twoslash, and `Callout` with `info`, `tip`, `warn`, or `danger`), and one finished page such as `content/docs/envapter.mdx`.
3. Write the whole page in one pass, start to finish.
4. Read [`writing-voice`](../writing-voice/SKILL.md) and this file, then read the page top to bottom and fix every line they flag.
5. Do step 4 again.
6. **Negation.** Find every verb followed by `no`, the `takes no flags` shape. Each one becomes not-negation or a positive statement.
7. **Connectors.** Count `and`, `so`, `which`, `while`, `because`, `since`, `then`. Any one connector carrying most of the page is the defect. Then check the reason-versus-consequence split from section 3, and read every connector against the relation it promises.

    The verb `names` is banned outright in [`writing-voice`](../writing-voice/SKILL.md), so nothing here counts it. It stood for three unrelated jobs across this guide, an error message telling you which one, a symbol being the whole set, and you writing them somewhere, and it hid for a long time because no single page held more than three.

    That ban came out of a wider rule. **One word does one job across the whole guide.** `verb` meant a reply method on the Replying tab and a store operation on the rate-limiter page, so a reader who met both learned neither. The repair picked a plain word for each, `method` and `operation`, rather than defining the same word twice.

    **A term the guide leans on gets defined the first time a reader can reach it, and that is tab order rather than the order you wrote the pages in.** `verb` debuted in a heading on `more-messages`, while `ack-states`, the page that could have defined it, sits after it in `meta.json`. A reviewer reading one page cannot catch this, so check it yourself against the tab's `meta.json` whenever you introduce a word the reader has to learn. Where no page is a good home for the definition, that is the sign to stop using the word.

    Read `fire` and `settle` in the same pass. "One fire of the event" and "once the handlers settle" make the reader translate a picture back into the fact, so write "dispatch" and "finishes".

8. **The garden path.** Read every sentence once at speed. Stopping and starting over means rewriting it. Four shapes cause it.
    - A clause wedged between a subject and its verb.
    - A cleft that parks the verb behind an `is`.
    - Two question-word clauses fronted as one subject, with the verb last. "Which of your calls answered it, and which method works from here, are both yours to work out" makes the reader hold both before learning what they are for. Open on the handoff: "That leaves you to work out which of your calls answered it, and which method works from here."
    - A trailing participle whose subject the reader has to guess.
    - A connector naming a relation the sentence does not have. See below, since this one has its own section.

### A connector promises a relation. Write the one that is there

Every connector tells the reader where the sentence goes next before they read it. `and` promises more of the same. `then` promises a step after a step. `so` promises a result, `because` a reason, `if` a condition. The reader acts on that promise, and a wrong one sends them off in a direction the sentence never takes.

Real ones, all caught by the maintainer, all in prose written the same week:

<!-- prettier-ignore-start -->

| written | what it promised | the real relation |
| --- | --- | --- |
| "A card needs a builder. Then you decide where that builder's code lives." | a second step | no sequence at all. Needing a builder is the moment. Cut the connector |
| "`this.instance` there is a `ContainerBuilder` and `setTitle` would stop the build" | a second item on that noun | opposition. The first names what works, the second what fails |
| "The next handler imports the same file, and changing the wording is one edit" | more of the same | consequence, so `so` |
| "Reword the card later and you edit `BanCard.ts` once" | more of the same | condition, so `if` |
| "the class decides what a ban card looks like, and a setter at the call site splits that description" | more of the same | contrast. The second clause is the case being argued against |
| "List the id under `ignoreCustomIds`, and the router returns before it answers" | more of the same | purpose, so "to make the router return" |
| "Read a member that the base leaves out and the compiler stops you" | an instruction to follow | a condition on a mistake, so `if` |
| "Where a handler only ever reaches that line in one state, name the verb yourself" | a place | a condition, so `if`. "If you already know the state, call `reply()` or `edit()` directly" |
| "`send()` rewrites the placeholder, even where you meant it as a new message" | a place | a concession on a condition, so `even when`, or cut the clause and give the reader the fix |

<!-- prettier-ignore-end -->

An imperative joined to its result by `and` hides the relation every time, even when the imperative is good advice. "Pass `true` and the getter throws" reads word by word as two facts, and a reader who learned English second has no intuition telling them the `and` means "if". Pick the connector by whether the reader wants the result. A result they want takes `to`: "Pass `true` to make the getter throw." A mistake or a side effect takes `if`: "If you read a member the base leaves out, TypeScript reports an error." Two instructions in a row keep their `and`, as in "Put them on your own buttons and return the whole reply".

A verb makes the same kind of promise. "Discord also allows one select menu per row" reads as an extra capability, and the fact is a limit. Write the limit as one: "A select menu takes a whole row."

`where` standing in for `when` or `if` is the same defect wearing a place word, and it is a habit worth watching for. "Where a handler only ever reaches that line in one state" and "even where you meant it as a new message" both point the reader at a location and hand them a condition. `where` earns its place naming a real place, as in "where the type-aware rules look for `tsconfig.json`". Say the condition out loud and the wrong one gives itself away, since nobody speaks either of those sentences.

**The test.** Read what follows the connector on its own. Ask what relation the word just promised, then ask what relation the two halves actually have. Where they differ, the reader pays for it.

The repairs, by relation. A result takes `so`. A reason takes `because` or `since`. A condition takes `if`, with the condition first. A contrast becomes two sentences, since naming the rejected case inside one sentence runs into the contrast ban. Where no relation exists, delete the connector and let the sentence stand on its own.

`and` carries most of these, and it hides in sentences that already spent a `so` or a `because`, where it becomes the place a third clause gets dumped. A sequence word is the other common one, since a page of steps makes `then` feel free to type.

A grep finds none of this. The tell is the direction the second half travels and no pattern sees that. Read every connector on the page and ask which way the words after it go.

### Unpack what you packed

A sentence can be correct and short and still take the reader two reads. It happens when a fact gets packed into fewer words than it needs, so the reader has to take it apart before the sentence means anything. A reader who learned English second pays the most. Every row below came from the maintainer's review of the Gates and Components tabs.

**The test.** Find the actor and the verb. If the reader has to hold a condition, a relation, or a list before reaching them, unpack the sentence.

<!-- prettier-ignore-start -->

| packed | what the reader has to unpack | unpacked |
| --- | --- | --- |
| "A commit that throws stops the rest and the handler" | a condition inside the subject | "If a commit throws, the commits after it don't run, and neither does your handler" |
| "one arm without a summary drops the list to a generic refusal" | a condition inside the subject | "If one arm doesn't set a summary, the `or` shows a generic refusal" |
| "`ArraySource` opens the last page for a number past the end" | a condition after the result | "If the number is higher than the last page, `ArraySource` opens the last page" |
| "every handler repeats them above its real work" | a position word standing in for where the code goes | "every handler starts with its own copy of them" |
| "an effect gate nested two levels inside an `or`" | a position word standing in for how the code is built | "passes `SpendCredit` to an `and`, and passes that `and` to an `or`" |
| "a number bigger than the list has pages" | a squeezed comparison | "a number higher than the last page" |

<!-- prettier-ignore-end -->

The repairs:

1. Pull a condition out of the subject or the end of the sentence, and put it first with `if` or `when`.
2. Replace a position word, like above, inside, nested, or past, with what the code does. Use the names the sample shows.
3. Once a sentence holds two facts, give the second its own sentence.
4. When a rule depends on order or covers several cases, name a small example and walk each case. The middleware page said `after()` runs "in the reverse of the order the middleware ran", and the reader had to work out what that meant for two middleware. "Say middleware `A` runs before middleware `B`", followed by one bullet per case, answered it at a glance. A sequence the rest of the page leans on gets a `txt output` diagram near the top, so later sections can point at a step. Draw it as a tree with `├─` and `└─`, the shape the effect-gates page uses, since columns of padded text are hard to follow.

A frontmatter description packs hardest, because it tries to fit a whole page into a line. Section 7 gives it a shape.

### The rest of the loop

<!-- these continue the loop's numbering from before the heading -->
<!-- markdownlint-disable MD029 -->

9. **Shape.** Read the page whole, out loud, as someone who has never seen it. Two questions. Does a person explaining this sound like this? Would a reader who learned English second get through without re-reading? Then check the spread against section 3.
10. Run both reviewers, in parallel. One Sonnet agent each. [`PROSE-REVIEW.md`](./PROSE-REVIEW.md) and [`CONTENT-REVIEW.md`](./CONTENT-REVIEW.md).
11. Fix what they find, then run step 9 again, since every fix is a sentence nothing has checked.

<!-- markdownlint-enable MD029 -->

A count tells you which word to look at. It never decides whether one sentence is wrong. Answer no to every frequency check and the page still ships whatever instances it has, so read each one and repair it on its own terms.

**A correction is a count too.** Being corrected on one sentence tells you which construction to go and look at. It never says every instance of it is wrong. Run that construction's own test on each one you find, since the rule catching the bad instance usually carries the exception protecting the good one.

`instead` came out of "Handler files go under the `interactions` path instead", where the reader held no alternative for it to point at. The same cut then landed on "Instead, just handle both in a single handler class", where the sentence before it had described the two handler classes and the shared helper. The maintainer put that one back, then put it back a second time after a later sweep cut it again. `writing-voice` states the test in the same breath as the ban: an `instead` naming a swap the reader is actually making stays. Read `instead` as a transition first, since a word joining two paragraphs is doing a job no wordlist can see.

`just` came off that same sentence both times, and it belongs there too. `writing-voice` bans the `just` that rates how hard a step is for someone whose keyboard you are not at. In "just handle both in a single handler class" the step really is one class, and the word says how little is left once seedcord holds the rest. Keep it where the sentence above has already shown the work it replaces.

**Say how little is left.** A paragraph answering a complaint earns a few words naming what the reader does now. [`getConfirmation`](ref:gateway/getConfirmation) "does all of that in one `await`". `mergeRoles` "does that in one call". The scaffold's eslint file "is one call instead". `CustomId` "declares what the string carries, once". Where the answer states the mechanism and stops, the reader works the saving out on their own. Vary the words. `for you` already runs about twenty times across the guide, so the twenty-first turns it into a chant.

**A repeated phrase is a count too.** Finding the same words twice tells you to go and look. It never says the second one is wrong. Ask what job each sentence is doing first, because two sentences doing different jobs can need the same words, and the repeat is the cheapest part of either one.

The emoji section had "while the bot starts" in two places. The opener used it to answer a complaint about doing a lookup per send, where `once` was the whole answer. The paragraph further down used it as decoration around the real fact, which is what happens when a name fails to resolve. Stripping the phrase took the answer out of the opener and left the decoration standing. The repair re-aimed the second sentence at its own job and left the first alone.

Where two sentences really are doing one job, cut the weaker one whole. Trimming a shared phrase out of both leaves two sentences that each say less.

The same count runs across the pages of one batch. Three pages that each open a setup on "Say" read as a template. English has many ways to set up an example, so write each one fresh for its page. Keep the wording one a reader who learned English second gets on the first read.

---

## 6. Answer these before writing

**Who reads this page?** Someone configuring a Node, Bun, Deno, Workers, or browser app. They know TypeScript and environment variables, and they have probably used `process.env` and dotenv. They may know nothing about envapt.

**What do they already know?** Anything you would have to teach them to make a sentence land does not belong here unless the page is about that thing.

**What is the one thing they need from this page?** Everything that does not serve it comes off.

**What does the reader do without each feature on this page?** Answer it per feature, in their terms, and the answer opens the section that teaches it. Per feature means per section, so a page carrying its why in one place has answered this once and owes the rest.

**What call does this surface hand them once they have it?** Where the code goes, which shape fits, what it costs later. Where there is a real one, a paragraph of it belongs on the page. Where there is none, write nothing.

**What are all the ways to use it?** Open the declaration of every symbol the page teaches and read it whole. A variadic parameter, an overload, a generic accepting a union, and an optional argument are each a separate way to use the surface.

Writing from the library's side is the failure that keeps recurring, and it comes from skipping these.

---

## 7. Mechanics every page follows

The content review checks this section as a list. A page that breaks one of these still renders, which is why nothing else catches them.

- **The frontmatter `description` says what the reader does with the feature, in one sentence of 100 to 160 characters.** It becomes the meta description, the link preview, the lede under the page title, and the first line of the page's Markdown copy, so the reader deciding whether to open the page reads it with nothing else. Someone who has never heard of envapt should get the gist from it alone. Lead with the task in the reader's words, and add the one detail that no neighbouring page shares. "Bind a PortableSource from the Cloudflare env object once at module load, then read typed config with the same API as everywhere else" tells someone in a search result that the Workers page is theirs. The page's sharpest fact belongs in the body. Leave out a list of what the page covers, since the table of contents already shows the headings and Google cuts a snippet at about 155 characters. Keep a colon followed by a space out of it, since the value is unquoted YAML. Backticks don't render in a description, so write a function name as `or()` to keep it from reading as the English word.
- **A page links the page that teaches a symbol on its first mention**, as in [`Envapter`](/docs/envapter). A table links its symbols again, since a reader lands on one row without the paragraph that held the first link.
- **Emphasis earns its place per word.** Italic stresses a word a reader would misread without it. Bold marks a UI label or a list label. There is no quota, and most paragraphs carry none.
- **Imports sit above `// ---cut---`**, the way almost every fence in the guide does it today. Prose around a fence can only name what the fence still shows, since a cut hides those lines from everyone except the writer.
- **A fence states how it shows types.** `^?` when the prose is about one or two of them. `hovers` when the reader has a shape worth exploring, at roughly five times the bytes and build time. `^|` when the reader's question is what they can type here. A bare `twoslash` with no marker when the sample only needs checking, which is most samples. Leave `twoslash` off when the sample is a fragment that cannot compile alone.
- **Check twoslash in a build.** `pnpm dev` runs with `TWOSLASH=0`, since `next dev` runs out of memory serving twoslash pages. `pnpm --filter @envapt/guide build` compiles every fence, and `dev:twoslash` serves them with an 8 GB heap. A page needing many compiled samples is usually two pages.
- **One `^|` per fence.** Two markers in one sample break it, since a line ending in a dangling dot swallows the line below into that member access and the second marker then resolves against nothing. Two questions want two fences. A failed marker throws at render and takes the whole page to a 500, so check any page carrying one in the browser before you move on. For an object key with nothing typed yet, end the line on a quote, as in `this.match({ '`. twoslash hands TypeScript the character before the caret as a trigger character, and `{` throws "Illegal value" while a space returns nothing.
- **Read the rendered list before writing the sentence above a `^|` fence.** The list holds what the type offers, which is often narrower than the prose assumes. `Commands.` offered the routes that are valid identifiers and left the slashed ones out, so a lead-in claiming it listed every route was false against the fence directly under it. Confirming the marker rendered is a separate question from confirming the sentence matches it.
- **A cut that hides trailing lines takes `---cut-after---`, and a fence carrying `@errors` takes no trailing cut at all.** `---cut---` alone leaves the closing braces on screen with nothing above them, closing a block the reader cannot see. `---cut-after---` fixes that on a `@noErrors` fence. On an `@errors` fence any cut after the error removes the annotation while the page still returns 200, so show the whole enclosing class and cut only the import, since cutting before the error is safe. After touching one of these, count `twoslash-error-line` in the rendered html, two per error. A line count misses a missing annotation.
- **A setting appears in a real sample that sets it**, as in `Envapter.strict = true`, on the page that teaches its subject, with any note as a `//` comment on the line.
- **A sample reads like shipped code.** It reads a realistic variable (`DATABASE_URL`, `CACHE_TTL`) as the type a real app needs. No toy keys like `FOO`, no hand-typed object in `useSource` where a real app binds `env` or `import.meta.env`, and no validation squeezed into a converter that a schema should do. Work done inline in a callback buries the lesson under indent, so pull it into a named function.
- **A symbol that behaves differently on the portable build says so where it's taught.** The node build binds `FileSource` on import. The portable build (Workers, the browser, edge) reads nothing until `useSource` runs, and its file APIs warn and do nothing. Check each member separately.
- **No page names a path under `src/`.** Read the `exports` map in `packages/envapt/package.json` to tell what is public. Name the public surface and stop.
- **Inline code stays short.** Backticks do not wrap, so a full error message or a chained expression pushes past the column on a narrow screen. Use quotes, a fence, or a table cell.
- **A trap uses the exact error string as its heading**, so a pasted error hits an anchor.
- **A section that narrows the one above it takes an H3.** One option inside "Adding options" nests under that H2, so the table of contents shows which section it belongs to.
- **A callout takes whole blocks, including a fence.** Use the blank-line form: `<Callout type="warn">`, a blank line, the blocks, a blank line, the close. The types are `info`, `tip`, `warn`, and `danger`.
- **A page assumes no prior page was read.** Someone opens it cold from search or the sidebar, so it names what it needs and links the rest. Introduction and Quick Start may build on each other, since they are the first two pages in order.
- **No page's code sample depends on a prior page**, wherever the page sits.
