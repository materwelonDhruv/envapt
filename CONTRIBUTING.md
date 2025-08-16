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

## Before You Start

- Check if there's already an issue for what you want to work on
- For big changes, please open an issue first to discuss your idea
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

## Code Style

I use a very strict ESLint config accompanied by Prettier to keep code consistent. Run `pnpm lint` to check your code style.

- Use TypeScript for new code
- Write clear, descriptive variable and function names
- Add comments for complex logic
- Keep functions small and focused

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
