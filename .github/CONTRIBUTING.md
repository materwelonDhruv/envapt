# Contributing to Envapt

Thanks for your interest in making Envapt better! I appreciate any help, whether it's fixing bugs, adding features, or improving documentation.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork to your local machine
3. Install dependencies: `pnpm install`
4. Make your changes
5. Test your changes: `pnpm coverage` (Make sure to not introduce new coverage gaps)
6. Submit a pull request

## What I'm Looking For

- **Bug fixes** - Found something broken? Please fix it!
- **New features** - Have an idea for a useful feature? Let's discuss it first by opening an issue
- **Documentation improvements** - Better docs help everyone
- **Performance improvements** - Faster code is always welcome
- **Tests** - More test coverage is great. Especially for edge-cases
- **Large features**: For any non trivial feature or architectural change, open an issue first and wait for my response before starting work. Large unsolicited pull requests may be closed without detailed review.

## Before You Start

- Check if there's already an issue (or PR) for what you want to work on
- For big changes, open an issue and discuss the design first. Do not start on a large refactor or new feature until there is agreement on the general approach please
- Make sure your code follows the existing style
- Write tests for new features or bug fixes

## Development Setup

```bash
# Clone your fork
git clone https://github.com/<username>/envapt.git
cd envapt

# Install dependencies
pnpm install

# Run tests
pnpm test

# Check code style
pnpm lint

# Build the project
pnpm build
```

You're ready to start working when all these succeed!

## Pull Request Guidelines

1. **One thing at a time** - Keep PRs focused on a single change or changes in the same relative scope
2. **Write good commit messages** - Follow conventional commit format and check the rules in `commitlint.config.mjs`
   - Also check out [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
   - Check out [How to Write a Good Commit Message](https://chris.beams.io/posts/git-commit/)

3. **Add a changeset** - For any changes made to the project, add a changeset file per commit:

   ```bash
   pnpm cs add
   ```

   - Choose the appropriate version bump (patch/minor/major)
   - Write a clear, user/developer-focused description of the change
     - Look at `CHANGELOG.md` for examples of good changeset descriptions
   - **Patch**: Bug fixes, performance improvements, internal changes
   - **Minor**: New features, new API methods, backwards-compatible changes
   - **Major**: Breaking changes, API removals, behavior changes

4. **Add tests** - New features need tests, bug fixes should include regression tests
5. **Update docs** - If you change how something works, update the README
6. **Keep it simple** - Prefer simple, readable code over clever tricks
7. **Unreviewed large changes**: If a pull request is very large, changes architecture or public API, or does not follow these guidelines, it may be closed without detailed review. I need to do this so it's manageable for everyone involved and so that any changes that could be problematic don't fall through.

## Code Style

I use a very strict ESLint config accompanied by Prettier to keep code consistent. Run `pnpm lint` to check your code style.

- This is a TypeScript first codebase. New runtime code **must** be TypeScript and **must** live under the existing envapt/src tree. If you believe plain JavaScript is necessary, please open an issue and get agreement first
  - Do not introduce the `any` type just to keep the compiler quiet. Unsafe casts such as `value as any` are not acceptable unless there is a very strong, documented reason. If the type system is fighting you, please talk through the design in an issue instead. There is almost always a way to infer the correct type. The project uses TypeScript for a reason 😄
- Write clear, descriptive variable and function names
- Add comments for complex logic
- Keep functions small and focused

## CI and checks

All pull requests must have

- Passing tests (`pnpm test` and `pnpm coverage`)
- Passing lint and type checks (`pnpm lint`)
- Passing commit lint (see `commitlint.config.mjs`)
- A valid changeset (`pnpm cs add`) (or multiple even)

Pull requests that do not pass CI will not be reviewed in detail.

## Testing

- All tests should pass before submitting a PR
- Add tests for new features
- Add regression tests for bug fixes
- Tests should be clear and easy to understand

## Questions?

If you have questions or need help:

- Open an issue on GitHub
- Check existing issues for similar questions
- Look at the README for examples

---

Thank you for helping improve Envapt!
