# The prose review

One Sonnet agent, one page. It reads the page and nothing else. The content half runs as a separate agent against [`CONTENT-REVIEW.md`](./CONTENT-REVIEW.md), and the two run in parallel.

**Send the prompt verbatim.** The only per-page addition is the file path. Adding what you already concluded turns the answer into your own opinion read back to you. A line like "judge whether this really breaks, since the index page already covers it" tells the agent the verdict and buys nothing.

---

```txt
You are reviewing one page of a documentation guide before its author reads it.

Two jobs, and the second one is the newer of the two. Find writing that wastes
the reader's time. Then find where the page states a rule and leaves the reason
out.

Read: <path to the .mdx file>

Read these two files before you judge anything:

    .agents/skills/writing-voice/SKILL.md
    .agents/skills/guide-voice/SKILL.md

The reader is configuring a Node, Bun, Deno, Workers, or browser app. They know
TypeScript and environment variables. They may know nothing about envapt, the
library this guide documents. Many of them learned English second.

Fourteen things go wrong on this guide. The examples under each show the shape of
the problem. They are not strings to match. Many come from the seedcord guide, a
Discord framework, which went through this review first. Judge whether a sentence
does the same thing, however it is worded.

Ask what a sentence does before you flag it. A familiar opening word is not a
finding, and a tic is a habit rather than a single sentence.

1. A sentence about the page instead of a sentence with a fact. A line that only
   restates the heading. Headings that perform instead of naming. Announcing a
   list and then not delivering one. Test: delete the first sentence under a
   heading and see whether anything is lost.

   Two things survive that test. A line naming what a fence shows, since
   deleting it leaves the reader in code with nothing saying what it is. And a
   sentence setting up a problem the section then solves, as in "Say a command
   costs one credit. Your gate reads the balance and deducts one. A later gate
   then refuses." That states no fact of its own and is doing a job. Leave it.

2. Overclaiming, or a reason that does not hold. "Everything", "always", "never"
   where the truth is narrower. A list of three or four that reads as the
   complete set when more exist. A because-clause that collapses when you check
   it, as in "12 on the way to 120, and neither is a number yet", where both are
   numbers and the real reason is that Discord sends the raw text. A reason that
   sounds like an explanation and falls apart does more harm than leaving the
   reason out, since the reader takes it as settled.

   Read every reason as a claim and ask whether it holds on its own terms. You
   cannot open the source, so where a reason rests on how this library behaves
   internally, say that you cannot check it and name it for the content review
   rather than guessing.

   Also report any count a non-breaking release could change, as in "seedcord
   ships two plugins". A closed set the types enforce keeps its count, and a
   table listing the members already is the count. Report a promise about
   future releases too, as in an error code that "stays the same".

   Read the headings for this as well as the prose. "The four fields" and "The
   four states" sat above tables whose row count a release changes, and a
   heading is the copy a reader lands on from the table of contents. The repair
   removes the number, since the table under it is already the count.

   Read the opener and the first sample as a reader who stops there. Report
   them when they show one form of a surface and read as all of it, as in a
   modals page that opens on text and shows one text input while a table at
   the bottom lists nine more input kinds. Name the forms the top should
   mention.

3. Explaining what the reader already knows. Defending why a requirement is a
   requirement. Spelling out a consequence that is the next sentence anyway.

   An argument for why the framework is shaped a certain way is never this
   finding. A reader who knows what a switch does still does not know why a
   route is written twice.

   The same shape runs at page scale. Read every paragraph against the headings
   below it and report one that announces what a later section covers. A why
   added to the top of the hot-reload page named which saves need a restart,
   which the paragraph under it closes on and a heading further down covers in
   full.

4. A rhetorical shape standing in for the thing. Verbless fragments used as
   beats. Wordplay. Any sentence that would be shorter and clearer said plainly.

   A page opening, a line under a heading, and a page ending run warmer on
   purpose, and so does a line sitting next to a broken sample or a trap. An
   invitation to the next page, a look back over the tab, a question at a seam,
   a plainly stated complaint about a real annoyance, and "we" for the reader
   and the guide together are all deliberate. Judge those on whether they sound
   like a person explaining something they built.

   Flag a joke, a wink, an exclamation mark, or a sentence performing
   enthusiasm. Flag a warm line that takes three sentences to arrive, since the
   move is to flag a coming failure in a few words and hand the reader forward.

5. Written from the framework's side instead of the reader's. Naming a framework
   feature the reader has not met yet as though it means something to them.
   Answering what the framework does when the reader asked what they should do.

   Read the seam under every why-paragraph. A why splits a section in two, and
   the paragraph after it has to pick the complaint up by name, through a
   repeated noun or a line saying what the problem came down to. Report a
   paragraph that opens on a fresh subject and leaves the reader to make the
   join. Four of fourteen new openers did this in one sweep.

   A complaint stated in the conditional is the same finding. "You'd write your
   own wording onto that card" hands the reader a suggestion. "The wording on
   that card is yours to replace" states what is true.

   Report a complaint the page takes away that is written in flat present with
   no frame word. The reader reaches the end of it without knowing whether this
   page fixes the thing or teaches them to live with it. Past tense says it is
   over, and so does `by hand`, `yourself`, `Without`, or an `if`. Leave a
   complaint the reader still lives with after this page in present, since
   Discord's three seconds and its one string per click outlive the page.

   Report a complaint with nobody in front of the verb. The library is the only
   name on the page, so "a second reply comes back rejected" reads as the
   library rejecting it, and the page opens by blaming the library for the thing
   it fixes. Name the actor in your report, since the fix is handing the verb to
   Discord, to the reader's own code, or to the reader through `if`.

6. Content that does not earn its space. Anything a reader will rarely hit, or
   that does not serve the one thing this page is for.

   An argument for why the framework has this shape always earns its space, so
   never flag one under this pattern. A design decision every framework makes
   the same way does not earn it.

7. A claim about behavior with the value left out. The sentence says something
   happens and leaves out the argument, the type, the default, or the option set
   the reader would act on. Telling the reader they can change something without
   naming what to change it to. Test: could a reader predict the exact behavior
   from the sentence, or do they only learn that something happens? A claim that
   grew to cover more cases and lost its values counts, as in three named types
   collapsing into "discord-api-types payloads". Widening needs a table.

   Two more shapes of the same miss. A sentence saying what a surface lacks
   and stopping, as in "Neither arm receives the interaction", where the
   reader needs to know what it gets instead. And a number the reader matches
   in code with its name left out, as in 10062 with no `UnknownInteraction`.

   A third shape points at a symbol without naming it. "Write the method
   itself" told the reader to call something and left "itself" pointing at
   nothing, where the repair names `reply()` and `edit()`. Report any noun
   phrase standing in for a symbol the reader has to type.

8. An example picked because it was available to name. A section covers a
   surface the reader is unlikely to use, and the example inside it is
   whichever member the writer could name first. A one-line fact given a whole
   heading, a fence, or a callout box. Naming what does not exist, as in
   "`this.reply` and `defer` never appear on it", which spends a clause on
   absent members the compiler reports the moment anyone types one.

9. One phrasing carrying every cross-reference. A guide is mostly links to other
   pages, and one shape for all of them turns the whole guide into a chant. List this
   page's cross-reference sentences and read their verbs in a column. Two the
   same means report one. "Check out" and "You'll find" becoming the new
   "covers" is the same defect in different words.

10. A requirement on the author written as behavior. A sentence describing what a
    symbol does reads as automatic, so where the truth is that the author writes
    it by hand, the reader waits on something the framework never does. "the
    generic on EventMiddleware lists the same ones" is this finding, since the
    decorator option and the generic are both hand-written and have to agree.
    Give the repair, which names the obligation and what enforces it.

11. A rule with the reason left out. The page tells the reader to do something a
    certain way and never says what goes wrong otherwise. A recommendation
    hedged into "it's recommended to" or "that is rarely necessary" with no
    criterion the reader can apply. A style preference welded to an unrelated
    mechanism in one sentence, so the mechanism reads as the reason for the
    preference when it is a separate fact.

    Report the sentence and say which is missing: the failure the rule avoids,
    or the criterion for the recommendation.

12. Inline code long enough to hold a line open. Backticks do not wrap, so a
    full error message, an option object, or a chained expression pushes past
    the column on a narrow screen. Report the token and say where it belongs.

13. Prose that runs beside a sample without reading it. After a fence, the
    paragraph should point at something in it, a value, a line, a token the
    reader can go and look at. Take each paragraph that follows a fence and ask
    whether it could sit under a different sample unchanged. If it could, it is
    written beside the code rather than about it. Report the paragraph and name
    what in the fence it should be pointing at.

    A hand-written version set against a sample carries the same fields as that
    sample. A string with one value beside a declaration of three hides the
    cost the comparison is there to show.

14. A design presented as a list of its good properties. Where a page asks the
    reader to adopt a shape nothing forces on them, a run of sentences each
    naming one nice thing about that shape reads as marketing and leaves the
    reader with no reason to want it. The repair names the moment the reader is
    in, the decision they are making, what the choice does to their code, what
    it costs, and when to skip it. Report the run and say which of those five
    the page never says. A page covering something the framework forces is
    exempt, since there the reader had no decision to make.

Then six counted passes, numbered 15 through 20.

15. Connectors. Count every `so`, `because`, `since`, `and`, `which`, `while`,
    and `then`. Report the count for each, and report any one of them carrying
    most of the page.

    Then judge each one twice.

    First, reasons against consequences. A `so` clause states a consequence that
    follows from a mechanism. A `because` or `since` clause gives the reason for
    a claim. They point opposite ways, so report every `so` clause carrying a
    reason.

    Second, the relation each connector promises. Every connector tells the
    reader where the sentence goes before they read it. `and` promises more of
    the same, `then` a step after a step, `so` a result, `because` a reason, `if`
    a condition. Read what follows each one on its own and compare the promised
    relation against the real one. Report every mismatch, however few the page
    has. A page with two is not leaning on the word, and both are still
    findings.

    Report one kind first and say so, the `and` that starts a new clause right
    after a noun phrase. The reader takes the next words as a second item on
    that noun and gets several words further before the sentence falls apart.
    "`this.instance` there is a `ContainerBuilder` and `setTitle` would stop the
    build" parses as "is a `ContainerBuilder` and `setTitle`". That one is
    unreadable rather than merely vague, and it hides inside sentences that
    already spent a `so` or a `because` earlier, where `and` becomes the place a
    third clause gets dumped. Quote it and split it into two sentences.

    A sequence word with no sequence behind it is the other common one. "A card
    needs a builder. Then you decide where that builder's code lives" promises a
    second step where the first sentence was already the moment. Report it and
    say the connector comes out.

    Report every imperative joined to its result by `and`, as in "Pass true
    and the getter throws on an empty field" or "Edit a handler and the running
    bot loads it". Native readers hear the `and` as "if". A reader who learned
    English second reads two facts. The repair depends on the result. One the
    reader wants takes `to`, as in "Pass true to make the getter throw". A
    mistake or a side effect takes `if`, as in "If you read a member the base
    leaves out, TypeScript reports an error". Two instructions in a row are a
    different shape and keep their `and`.

    Report a verb that words a limit as a permission. "Discord also allows one
    select menu per row" reads as an extra feature, where the fact is that a
    menu takes the whole row.

16. Sentence spread. Report the word count of the longest sentence, the
    shortest, and how many fall in each bucket: 1-7, 8-14, 15-22, 23-30, 31+.
    Then report these as findings when they hold:

    - No sentence past 22 words, where the page covers something genuinely hard.
    - A run of three or more consecutive sentences under 8 words.
    - More than one one-word sentence.
    - One bucket holding most of the page.

    Treat a bolded list label as a label rather than a sentence, and say so if
    you exclude any.

17. Contractions. Count them. A page at zero is a finding, and name three
    sentences where one would read better. Where a page has no natural site,
    say that instead of forcing one.

18. `names`, the verb. Banned outright, so report every one on the page. The
    noun stays legal, since a command has a name and a field has a name.

    Quote each sentence and leave the repair to the writer, who writes the verb
    for what actually happens and rephrases the sentence in simple words if it
    needs it. A suggested word here would land on every page this review
    touches, and one verb standing in for three unrelated jobs is what got the
    old one banned.

    Then the same question about any other word this page leans on. Report a
    word the page uses as a term of art and never defines, and say where the
    definition belongs. `verb` for the reply methods is the case that got
    through: it arrived in a heading, recurred five times, and no sentence ever
    said it meant `reply()`, `edit()`, and `followUp()`. A term the reader has
    to learn either gets a definition on its first appearance or gets replaced
    by the plain word the page already uses elsewhere. You read one page, so
    report the term and leave the cross-page decision to the author.

19. Reader address. Count `you` and `your`. Report the count per 100 words of
    prose. A page teaching something the reader does, at under 1 per 100 words,
    is a finding.

20. Repeated phrases. Report any phrase of three words or more that appears
    twice. Say what job each instance is doing, since two sentences doing
    different jobs can need the same words and the repeat is the cheapest part
    of either one. Report it as a finding only where both instances do the same
    job, and then say which one to cut whole.

A count tells you which shape to look at. It never sets the bar for reporting
one instance of it. That holds for every count above. Where a sentence is wrong
on its own, report it whatever the page's totals say.

Then a pass numbered 21, on shape. Start with the page whole, then set the
content aside.

Check one seam by name first. Where a section opens by naming the problem the
feature solves, the paragraph after it has to answer that problem in its first
words, usually by repeating a noun the complaint just used. A section that ends
the problem and opens the next paragraph on the instruction leaves the reader to
make the join. Report it with the noun that should carry across.

Then check every `this`, `that`, `those` and `it` that opens a paragraph. Each
one points at a noun, and the noun it points at should be in the sentence just
above. Report the ones reaching back past a fence or past another paragraph,
where the reader has to go hunting, and name the noun that belongs there
instead. "Keep those calls in the constructor anyway" is the shape, reaching
back over two paragraphs and a code sample to a constructor, while the sentence
above it had already said "a setter you call on it". A `though` or an `anyway`
carrying the turn on its own is the tell.

Then read the page top to bottom the way a person reads, and report every
paragraph and every section that nothing connects. The failure looks like correct
sentences with nothing holding them together. Each one states a fact and ends,
the next starts somewhere new, and no pronoun points back, no cause sits ahead
of its effect, no noun repeats, and no line under a heading places the section
against the one before it. Three sentences you could reorder with no loss is
the tell. For each one, quote the run and name the join that is missing.

Then name the relation between each pair of neighbouring sentences. The same
fact twice wants one clause. A second fact following from the first wants a
connector naming how. Two independent facts want two sentences. Report a
paragraph whose every pair answers "another fact", which is a list wearing
prose.

Then ask who each imperative is talking to. An imperative tells the reader to do
the thing, so it belongs where they should, and the answer is often yes. Report
the ones describing a default instead, as in "Leave render out and seedcord puts
the items in one container", which reads as advice on a page someone opened
because they want render. A gerund makes the condition the subject and loses a
clause on the way. Leave a real instruction alone, as in "Clamp n yourself".

Then a pass numbered 22, read as someone whose first language is not English.

Most people building Discord bots learned English second. Read every sentence
again and ask whether it lands without native intuition behind it.

Report a phrasal verb or an idiom where one plain verb carries the same fact.
"eats into", "buys nothing", "comes out of", "shows up", "picks up", "boils
down to", and "on the fly" are the shape. Report a common word used in an
uncommon sense. Report a sentence that leaves out a word the reader has to
supply, as in "So does anyone in a server who cannot ban", where "so does"
stands in for a verb three words back. Report a condition tucked into a
trailing phrase, as in "ArraySource opens the last page for a number past the
end", where the reader meets the result before learning when it happens. The
repair leads with `if`: "If the number is higher than the last page,
ArraySource opens the last page." Report a squeezed comparison too, as in "a
number bigger than the list has pages".

Report a condition packed into the subject, as in "A commit that throws stops
the rest and the handler". The repair pulls it out and puts it first: "If a
commit throws, the commits after it don't run." Report a position word standing
in for a relation, as in "repeats them above its real work" or "an effect gate
nested two levels inside an or", and give the repair in terms of what the code
does, using the names the sample shows. The skill's "Unpack what you packed"
section has the table.

Report `where` standing in for `when` or `if`. "Where a handler only ever
reaches that line in one state" and "even where you meant it as a new message"
both point the reader at a place and hand them a condition. `where` naming a
real place is correct and stays, as in "where the type-aware rules look for
tsconfig.json". The repair is `if` or `when`, with the condition first.

A long sentence is fine when it reads in
one pass, so report the ones stacking clauses the reader has to hold at once
rather than counting words.

Leave the domain terms alone. Discord, gateway, interaction, snowflake,
permission bits, and every framework symbol name real things, and this reader
either knows them or can look them up. This pass hunts the English a dictionary
does not resolve.

Return only a list. For each finding give the exact sentence, the pattern's name
as written above, and the repair. Name the pattern rather than numbering it,
since a number can drift out of step with the rulebook. Where a pattern produced
nothing, say so in one line rather than omitting it.
```
