---
description: Audit (and optionally fix) code-comment quality on the working-tree changes via a subagent
argument-hint: '[opus|sonnet] [lenient|standard|strict] [dry-run]'
---

Run a code-comment audit through a single subagent, then relay its report.

Parse these from `$ARGUMENTS` (tokens may appear in any order, all optional):

- **model** — `opus` or `sonnet`. Default `sonnet`. Spawn the subagent with the Agent tool (`subagent_type: general-purpose`) using this model.
- **strictness** — `lenient`, `standard`, or `strict`. Default `standard`. Sets the keep-vs-cut threshold.
- **dry-run** — on if any of `dry-run`, `dryrun`, `report`, `preview` appear. When on, the subagent edits NOTHING and only reports what it would change. Default off. Subagent should edit in place when off.

Give the subagent exactly this task, filling in the chosen strictness level and mode:

---

You are auditing code comments for quality. Apply the project's commenting guidelines without bias. Do not assume existing comments are correct, form your own judgment.

Read these first, they are the standard you enforce:

- `.github/skills/code-commenting-guidelines/SKILL.md` (and anything it references)
- `~/.claude/CLAUDE.md` (the "## Comments" and "## Em-dashes" sections, global rules that also apply)
- `CLAUDE.md` (repo conventions)

Scope: only the comments in files that show up as modified or added in `git status --short` (run it yourself to get the list). Skip deleted files. Do NOT touch any file that is not already changed in the working tree.

Strictness for this run: **<LEVEL>**. Apply that level's threshold and ignore the others:

- **lenient** — fix only unambiguous violations: narrate-then-justify, type-paraphrase, "I'm doing X" wrappers, em-dashes, and stale/contradictory comments. Leave every borderline or judgment-call comment alone.
- **standard** — the full guidelines as written: also trim decorative TSDoc on internal helpers and per-overload captions, and cut any comment that fails "would a careful reader misunderstand this code without it?". Keep genuine guardrails and invariants.
- **strict** — minimalist. For every comment apply "if someone deleted this AND mechanically refactored, would they reintroduce a bug?", if no, cut it. Collapse multi-line whys to one line. Every surviving comment must earn its place.

Mode for this run: **<MODE>**.

- **edit** — edit the in-scope files in place: remove, tighten, or rewrite comments per the level above, and add a comment only where the guidelines say a load-bearing one is missing. Also fix the justification text on any `eslint-disable` / `ts-*` directives if needed. Comments and directive-justification text ONLY, never change runtime logic, types, or behavior. Then run the per-package gates for every package you touched and confirm clean (plain `lint`, never `lint:fix` or `--fix`): `pnpm -C <pkg> lint && pnpm -C <pkg> tc`. Fix by hand any lint failure your edits cause.
- **dry-run** — edit NOTHING and run nothing that writes. Produce a per-file list of every change you WOULD make: the comment's location, the action (cut / rewrite / add), and a before→after for rewrites.

Do NOT commit. Do NOT run git writes.

Report per file: what you changed (or would change), and which guideline drove each; and explicitly call out any comment you deliberately KEPT that a reviewer might question, with your reasoning.

---

When the subagent finishes, relay its report so I can act on it. Do not make further edits yourself unless I ask.
