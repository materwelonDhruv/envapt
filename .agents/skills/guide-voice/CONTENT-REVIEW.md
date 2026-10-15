# The content review

One Sonnet agent, one page. It reads the page plus the declarations the page teaches from, and it opens source files. The prose half runs as a separate agent against [`PROSE-REVIEW.md`](./PROSE-REVIEW.md), and the two run in parallel.

The split is deliberate. This half has to open source to do its job. The prose half never should, because a page's own text is what it is judging.

**Send the prompt verbatim.** Fill in four per-page fields and change nothing else: the file path, the symbols the page teaches, which sibling pages cover which material, and which of the four design arguments this page is responsible for. Adding the verdict you already reached turns the answer into your own opinion read back to you.

Section 1 of the skill lists the four arguments. Which page is responsible for each one is a content decision rather than a rule, so you fill that field in when you send the prompt.

---

```txt
You are checking one page of a documentation guide against the code it
documents, before the author reads it.

You are not reviewing the writing. A separate agent does that. Your job is
whether the page is true, whether it is complete, and whether it explains the
design decision it asks the reader to adopt.

Read: <path to the .mdx file>

The page teaches these symbols: <list them>
These sibling pages own this material, so it is out of scope here: <list them>

Read this file before you judge anything:

    .agents/skills/guide-voice/SKILL.md

Use the codebase-memory MCP for structure, then open every declaration yourself
and read it whole. Never assert a claim about the code you have not opened. Give
a file and line for every finding.

Eight checks.

1. The argument this page is responsible for.

   This page is responsible for the argument about: <name it, or write "none">

   If it has one, report whether the page carries it and where. An argument has
   four beats: the rule, the mechanical reason, the consequence, and the cost or
   exception disclosed on the spot. Report which beats are missing.

   The reader meets these decisions in the first code sample they ever see, so a
   page that shows the shape and never argues for it leaves them following
   instructions on faith. Report the paragraph that should exist and what it has
   to say, sourced from the code.

   Where the field above says none, say so in one line and move on.

2. Every feature's reason to exist.

   Take each section of the page and read its opening. A section that teaches a
   feature says what the reader does without it and what that costs them, in one
   or two sentences, before it says how to configure the thing.

   A real miss, from the seedcord guide (a Discord framework). The emoji section
   opened on "Name each custom emoji in your
   config, then read it back by that name", where the fact the reader needed is
   that Discord takes a custom emoji as <:name:id>, so without the map those ids
   spread through the message code and go stale on a re-upload.

   For each section report whether it answers this, and where it does not, write
   the answer yourself from the declarations and from what the platform
   requires. Name the file and line, or name the platform rule. Report the ones
   you cannot source rather than reasoning one out.

   Take this per section. A page carrying one reason near the top has answered
   it for that section alone, so keep going through the rest.

   Then, for each section, ask what call the surface hands the reader once they
   have it. Where the code goes, which of two shapes fits, what today's choice
   costs them later. Report a section that teaches a surface carrying a real
   decision and says nothing about it, and name the decision, sourced from the
   declarations. Two things disqualify one: advice that would read the same
   about any library, and a section whose surface genuinely offers no choice.
   A reference table, a flag list, and a troubleshooting page are all exempt.

3. Every claim about behavior, checked against the source.

   Read every sentence stating what the code does. Open the declaration and
   confirm it. Report every claim that is wrong, and every claim that is true of
   one class and stated as though it covers a family.

   A real example of the second kind. A page said "Reading .component applies
   your bot color" beside an example using RowComponent, where that getter
   returns the builder and leaves the color alone.

   A third kind hides in prose that compresses a table. Where the page carries
   a per-member map, a legality table, a flag list, or a state machine, some
   sentence further down sums it up in a clause, and the summary is where the
   overclaim lands. Check each summarizing sentence against the map entry by
   entry and name the members it gets wrong. "They throw when the state is
   something else" covered two methods at once, where one of them has a single
   illegal state out of four. The table three sections above it was right the
   whole time, which is why reading the page alone does not catch this.

4. Every way of using the surface.

   Open the declaration of each symbol the page teaches and read the variadic
   parameters, the overloads, the optional arguments, and the bounds on every
   generic. Each distinct form is a separate way to use the surface and each one
   belongs on the page once. A decorator declared (...names: Names[]) where
   every fence passes a single name is this finding. So is a generic accepting a
   union where every fence passes one member.

   Report the form that is missing and name the file and line of the declaration
   that offers it.

5. Optional markers.

   Report every parameter or field the page states flatly where the declaration
   marks it optional, gives it a default, or makes the whole options argument
   optional. A parameter read as required costs the reader an argument they
   never needed. A field read as always present costs them a guard they skipped
   on something that can be absent. The reverse counts too, prose calling
   optional something the declaration requires.

   Report the sentence and the declaration's file and line.

6. Build differences.

   envapt ships two builds. The node build (packages/envapt/src/index.ts, with
   engine/NodeEnvapter.ts) binds FileSource on import and runs the file APIs.
   The portable build (src/index.portable.ts, with engine/PortableEnvapter.ts)
   serves Workers, the browser, and edge runtimes. It reads nothing until
   useSource binds a source, and its file APIs warn once and do nothing by
   default. For each symbol the page teaches, compare the two and report every
   difference the page does not mention where it teaches the symbol.

   Check each member separately. A note covering a class does not cover a
   second member on it that differs on its own.

   Where nothing on the page differs, say that in one line.

7. Public surface.

   Report any symbol the page names that the package does not export. Read the
   exports map in packages/envapt/package.json and the entry files it points
   at. Report any path under src/ named on the page too. Name the public
   surface that replaces it.

8. The page mechanics.

   Section 7 of the skill lists the conventions a page follows. A page that
   breaks one still renders, so nothing else catches them. Walk that list
   against this page and report every miss with the line.

   Read the frontmatter `description` last, against the finished page. Report one
   that states a single fact from the body in place of what the reader does with
   the feature, and one that promises something the page does not teach. Report
   one that leaves a reader who has never seen envapt unable to tell what the
   page is for, and one that lists the page's sections. Section 7 asks for one
   sentence on what the reader does, plus the detail no neighbouring page shares.

   Several need a file open, which is why they are here rather than in the prose
   review. The link targets, the import-line cut convention, the fence type
   against what the paragraph is about, a setting named without a sample that
   sets it, a toy sample where a real app's read belongs, and prose naming code
   that a cut hides.

   Check the completion marker by name. `^?` answers "what type is this" and
   `^|` draws the list an editor would offer at that point. Report every place
   the paragraph's real question is "what can I type here" and the page answers
   it by writing the names out in prose, since the marker replaces that
   sentence. The converter tokens on `Converters.` and the casing names on
   getRequiredAll are where this lands. A `^|` fence needs `// @noErrors`, since
   the sample is a partial expression by construction. Name the fence and the
   line.

   Check the cut markers on every fence that carries one, since two failures
   here render without an error and nothing else catches them.

   First, a `---cut---` inside a method body hides the class and the signature
   while the trailing `}` lines stay on screen, so the render ends on braces
   closing a block the reader cannot see. Report the fence. A `@noErrors` fence
   adds `---cut-after---` under its last visible line. A fence carrying
   `@errors` shows the whole enclosing class and cuts only the import.

   Second, a fence carrying `@errors` plus any cut after the error removes the
   error annotation while the page still returns 200. Report every `@errors`
   fence holding a `---cut-after---`, a `---cut-start---`, or a `---cut-end---`,
   then confirm against the rendered page which of them actually lost its
   annotation, counting `twoslash-error-line` at two occurrences per error. A
   line count misses a missing annotation.

   Read the rendered completion list too, and compare it against the sentence
   above the fence. The list holds what the type offers, which is often
   narrower than the prose assumes.

   Check that every symbol in a table links the page that teaches it, even
   where the prose above already linked it.

Two rules on how you answer.

Never invent a reason. Where the code shows a decision and no record explains
it, report that the argument is missing and say what the code does. Do not
supply a rationale you reasoned out yourself and present it as the project's.

Report a negative plainly. Where a check found nothing, say so in one line
rather than omitting it, so the author knows it ran.

Return only a list. For each finding give the check number, the sentence or the
gap, the file and line of the declaration that settles it, and the repair.
```
