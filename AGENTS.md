# envapt agent guidelines

Rules for anyone working in this repo with an AI coding tool. `CLAUDE.md` symlinks to this file.

[`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) covers setup and PR mechanics. [`packages/envapt/README.md`](packages/envapt/README.md) describes the library.

envapt is past 1.0. Breaking changes ship only in a major. Pick the cleanest design and break things at a major to get it right. Add a changeset for every change to `packages/envapt/**`.

---

## Load these skills first

Before any work, load the four skills in [`.agents/skills`](.agents/skills): `code-quality` and `tdd` with every file in their folders, plus `code-commenting-guidelines` and `writing-voice`. Load `guide-voice` before writing or reviewing a page under `apps/guide/content`, `changeset-guidelines` before writing a changeset, and `release-version` before cutting a release. `skills/envapt` is the skill shipped to envapt's users. Read it when a change touches the public API, since it needs the same update as the docs.

---

## Ground every claim

The expensive failure here is a confident sentence about how two modules connect that nobody checked.

1. **Cite or flag every load-bearing claim.** Give a `file:line` you opened this session, or write the word "assumption".
2. **Open both ends.** Read the module that implements a thing and the module that consumes it before you write an interface or the words "X must be Y".
3. **Verify before you repeat.** A claim from a subagent, a summary, or your own memory is unverified until you reopen the source.

---

## Repo map

<!-- prettier-ignore-start -->

| path | what lives there |
| --- | --- |
| `packages/envapt/src` | the library |
| `packages/envapt/tests` | vitest tests, numbered, each with an `.env.*` fixture, plus the `browser/`, `workers/`, `integration/`, and `*-emit/` suites |
| `apps/guide` | the Fumadocs site at envapt.materwelon.dev |
| `skills/envapt` | the skill published for envapt's users |
| `scripts` | the catalog check, the semver labeler, and the release scripts under `scripts/release` |
| `.agents/skills` | the agent skills for this repo. `.claude/skills` symlinks here |
| `.changeset` | pending changesets |

<!-- prettier-ignore-end -->

Inside `packages/envapt/src`:

- `index.ts` is the Node/Bun/Deno entry. `index.portable.ts` is the build the `browser`, `workerd`, and `edge-light` conditions resolve to. `common.ts` holds what both share. `legacy.ts` is `envapt/legacy`. `config.ts` is the `envapt/config` side-effect entry.
- `core/` is the reader mixin chain, `EnvapterBase` → `EnvironmentMethods` → `ReaderMethods`, plus module state and the cache.
- `engine/` holds the exported `Envapter` classes, `TemplateResolver`, and `Validators`.
- `sources/` holds the `Source` layer (`FileSource`, `PortableSource`, `merge`).
- `converters/`, `decorators/` (`modern/` and `legacy/`), `infra/` (dotenv, debug, errors, the inlined Standard Schema), and `types/`.

The `exports` map in `packages/envapt/package.json` is the public surface. Never point `paths` or `include` at another workspace's `src`.

`.vscode/` is tracked only for the four standard editor configs. Everything else in it is a private planning repo. Never cite a `.vscode/` path or an internal id in anything that ships.

---

## Design rules

- **OOP for complex domain logic, plain functions for small stateless helpers.** Reader behavior extends the `core/` mixin chain. No static-only classes as namespaces. `BuiltInConverters` is the dispatch-table exception. The `Envapter` reader chain is the other one, because user config classes extend it.
- **Function declarations for exported functions with a body.** Arrow functions for inline callbacks and one-liners.
- **Throw `EnvaptError` with a code from `EnvaptErrorCodes`.** A new failure gets a new code and a row on the guide's errors page.
- **Types.** No `any` in production code. Narrow `unknown` with a guard. No `as unknown as T`. Use `import type`. Tests may cast a fixture with a short comment saying why it is safe.
- **Write each rule once.** When two places compute the same answer, both call one function. A comment like "keep in sync with X" means the rule exists twice.
- **Only implement what was asked.** Surface additions as a question first. Wait for the third use before extracting an abstraction.
- **No dead code.** Before adding `export`, confirm something outside the file imports it. A symbol that exists only for a test belongs in the test folder.
- **Grep every consuming surface before deleting anything,** including the guide content, `skills/envapt`, and both READMEs.
- **Commit subjects are one lowercase line with no scope and no body.** Write `feat:`, never `feat(core):`. A breaking change marks the bare type, `feat!:`.
- **Move files with `git mv`. Add dependencies with `pnpm add --filter <workspace>`.** Read a new package's README and peer range before using it.

Never edit `AGENTS.md` or `CLAUDE.md` without explicit permission.

The maintainer may leave a `Note for Agent:` comment as a deliberate lint or type error. Read it, do what it says, then remove it.

---

## Decorators

`@Envapt` and the sugar decorators are TC39 Stage 3 accessor decorators. The legacy property decorators live in `envapt/legacy`.

- **Modern fields use `accessor`.** `static accessor x: T`, or `accessor x!: T` on an instance. No `readonly`, no `declare`, no initializer.
- **Legacy fields need `experimentalDecorators: true`.** `static readonly x: T`, or `declare readonly x: T` on an instance, with no initializer. A `declare static` field reads `undefined` under tsc.
- **Both forms check the field type against the converter output** through the branded types in `types/Decorator.ts`. Assigning to a decorated field throws.
- **Sugar decorators stay thin.** Conversion and validation belong in the converter.

Test modern decorators in `tests/stage3-emit`, which compiles with tsc and runs on node, bun, and deno. vitest's transform leaves `context.name` unset on accessor decorators.

---

## Commands and gates

Run from the repo root. Turbo dispatches to both workspaces.

```sh
pnpm lint:fix      # always lint:fix, never plain lint
pnpm tc
pnpm lint:fix:md   # when you touched markdown
pnpm test          # after lint and tc pass
pnpm prePush       # every check, before you push
```

The pre-commit hook runs `lint-staged`, which formats the staged files and lints them with zero warnings allowed. No hook runs on push, so run `pnpm prePush` yourself.

`pnpm --filter envapt <script>` targets the library. `pnpm --filter envapt build` rebuilds it before checking the guide against new types. The guide's twoslash blocks compile only in `pnpm --filter @envapt/guide build`.

`pnpm knip` (dead code) and `pnpm react-doctor` (React patterns) are real gates that no hook runs. Run them when the change warrants it.

Zero lint errors, zero lint warnings, zero from `tc`, every test passing. Fix the cause. Never comment out a test, weaken an assertion, or add a broad `eslint-disable`. Disable a rule inline with a reason, `// eslint-disable-next-line <rule> -- <why>`.

---

## Tests

Reproduce a bug with a failing test before fixing it. A test that passes before the fix proves nothing.

Tests reach behavior through the public API. A test that reads a private method or mocks a module you own breaks on the next refactor.

A test pins behavior. `tsc`, ESLint, and the build already reject a missing export or a wrong type. No tautological tests, and nothing gets a test for staying absent.

Before you add a test, find the one that already asserts the same input and outcome. If it exists, add nothing, or put the new assertion in that test. Code that several readers or converters share gets one test. A specific input stays tested even when its code path is covered, because the input is the behavior.

Never test a setter that only stores its value, a type that restates its declaration, or something JavaScript or a dependency does on its own.

---

## Subagents

Set `model` explicitly on every subagent: `sonnet` for research and summaries, `opus` for design and synthesis. Give a research agent the question, the scope, and the output shape. Leave out your suspected answer.

---

## Ask before acting outside the repo

Anything that leaves this machine needs an explicit request first: opening a PR, filing or commenting on an issue, publishing a package, and deploying. Prepare the work, show it, and wait.

---

## Response format

End the final response with a short list of the files that changed, what changed in each, and why.
