## Summary

What does this pull request do? Keep it short and focused.

## Related issue

Link to the GitHub issue that describes the problem and agreed design.

- Closes #

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Internal refactor
- [ ] Documentation

## Scope check

- [ ] This pull request focuses on one feature or closely related set of changes
- [ ] No new packages or top level projects are introduced inside this repository
- [ ] No core files have been copy pasted into new folders
- [ ] Changes are limited to the existing `envapt/src` tree and necessary tests or docs

## Implementation notes

Explain how you implemented the change.

- Key types or functions you added or modified
- Anything that might surprise a reviewer
- How this fits with the existing Envapt API and EnvaptError behavior

## TypeScript and safety

- [ ] New code is written in strict TypeScript
- [ ] No new `any` types were introduced (if they were, explain why)
- [ ] No `value as any` style casts were added to bypass the type system
- [ ] No unnecessary type casts were added
- [ ] Existing strict TypeScript settings were not disabled or loosened
- [ ] New code has complete type coverage (no `@ts-ignore` or missing types)
- [ ] New code uses proper TypeScript generics or unions where applicable
- [ ] Public types and signatures are well defined and documented where needed

## Tests

- [ ] `pnpm lint` passes with zero lint errors (without the need for unnecessary `/* eslint-disable */` comments or changes to existing lint rules)
- [ ] `pnpm test` passes locally
- [ ] `pnpm coverage` passes locally without new coverage gaps
- [ ] New or updated tests cover the behavior in this pull request

Describe the tests you added or updated.

## Docs and changesets

- [ ] README or other docs were updated if behavior changed
- [ ] A changeset was added with `pnpm cs add`, uses the correct bump level, and has a clear summary

## Checklist

- [ ] I have read and followed `CONTRIBUTING.md`
- [ ] Commit messages and PR title follow Conventional Commits
- [ ] CI is expected to pass for this branch
