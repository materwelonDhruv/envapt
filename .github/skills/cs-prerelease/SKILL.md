---
name: cs-prerelease
description: Run a manual pre-release publish from a long-lived `next` branch using changesets pre-release mode. Use this when you need to publish a `5.0.0-next.N` (or similar pre-release) to npm + JSR from envapt's `next` branch. Avoids the common `403 cannot publish over previous versions` and `version not found` errors by walking each step explicitly.
---

# Manual changesets pre-release from `next`

This skill is the safe, manual recipe for publishing a pre-release of envapt from the long-lived `next` branch. It's deliberately manual because the auto-publish workflow only triggers on `main` — `next` is in pre-release mode and we want every publish to be intentional.

## When to invoke

- You're on the `next` branch.
- A meaningful chunk of v5 work has merged (one or more PRs with changesets attached).
- You want to publish `5.0.0-next.N` to npm + JSR so users can `pnpm add envapt@next` and try it.

## When NOT to invoke

- You're on `main` — `main` uses the regular auto-publish workflow via `.github/workflows/publish.yml`.
- You're testing locally — use `pnpm cs:status` to see what would publish without actually publishing.
- `.changeset/pre.json` doesn't exist on the branch — pre-release mode is not entered. See "First-time setup" below.

## Pre-flight check

```sh
# Confirm you're on next
git rev-parse --abbrev-ref HEAD       # should print: next

# Confirm pre-mode is active
cat .changeset/pre.json               # should show mode: "pre", tag: "next"

# Pull latest
git pull origin next

# Confirm what's pending
pnpm cs:status                        # shows each changeset and the version bump it would produce
```

If `cs:status` shows nothing, there's nothing to publish — abort.

## The recipe (one publish)

```sh
# 1. Bump versions + write the changelog. Reads every .md file in .changeset/
#    and produces a 5.0.0-next.N bump (auto-incremented from the previous pre-release).
pnpm changeset version

# 2. Sync the lockfile to the new versions.
pnpm install

# 3. Commit the version bump + changelog updates.
git add -A
git commit -m "chore: version 5.0.0-next.N"
git push origin next

# 4. Build the package fresh.
pnpm build

# 5. Publish to npm. Reads .changeset/pre.json's tag field and passes --tag next to npm publish.
pnpm changeset publish

# 6. JSR publish (if envapt is also pre-releasing to JSR — verify before running).
#    The publish workflow on main runs this via .github/actions/deno-publish-all;
#    for pre-releases we run it manually.
pnpm exec tsx scripts/bump-jsr.ts     # sync deno.json's version to package.json's
pnpm --filter envapt exec deno publish --dry-run     # verify first
pnpm --filter envapt exec deno publish               # actually publish to JSR

# 7. Push the auto-generated git tag (changeset publish creates one).
git push origin --tags
```

## Verifying the publish worked

```sh
# npm
npm view envapt dist-tags             # should show: { latest: '4.1.1', next: '5.0.0-next.N' }
npm view envapt@next version          # should print: 5.0.0-next.N

# JSR (if applicable)
curl -s https://jsr.io/@materwelon/envapt/meta.json | jq '.versions | keys'
```

If `latest` got bumped to a `5.0.0-next.N` value, **something went wrong** — the `--tag next` from `pre.json` didn't apply. Rollback:

```sh
# Re-tag the previous stable as latest
npm dist-tag add envapt@4.1.1 latest
npm dist-tag add envapt@5.0.0-next.N next
```

## Common error modes

### `403 Forbidden: you cannot publish over the previously published versions`

You ran `npm publish` directly instead of `pnpm changeset publish`. The first tries to publish the version currently in `package.json` (which already exists); the second reads `.changeset/pre.json` and bumps before publishing.

**Fix:** always go through `changeset publish`, never `npm publish` / `pnpm publish` directly on `next`.

### `npm ERR! version not found`

You ran `changeset publish` before `changeset version`. The `version` step writes the new version into `packages/envapt/package.json`; without it, publish tries to push a version that hasn't been created yet.

**Fix:** always run `pnpm changeset version` first.

### Publish succeeded but `latest` got overwritten with a pre-release

`.changeset/pre.json` was missing or its `tag` field didn't say `"next"`. `changeset publish` falls back to `latest` dist-tag if the pre-release tag isn't configured.

**Fix:**

```sh
# Re-enter pre-release mode (re-creates pre.json)
pnpm changeset pre enter next
git add .changeset/pre.json
git commit -m "chore: re-enter pre-release mode"
# Then re-publish per the recipe; npm will accept the new pre-release version
# and you can fix dist-tags as shown in "Verifying the publish worked".
```

### `pnpm install` fails after `changeset version`

Usually a stale `pnpm-lock.yaml` referencing the old version. Try:

```sh
pnpm install --no-frozen-lockfile
```

Then commit the updated lockfile alongside the version bump.

## First-time setup (only needed once per pre-release cycle)

Done already if `next` branch was created via the v5 setup. For reference / if you ever need to redo it:

```sh
git checkout next
pnpm changeset pre enter next          # creates .changeset/pre.json with tag=next
git add .changeset/pre.json
git commit -m "chore: enter changeset pre-release mode for v5 (tag: next)"
git push origin next
```

## Exiting pre-release mode (when v5 ships stable)

When v5 is ready to become the new stable (i.e., we're about to merge `next` → `main`):

```sh
git checkout next
pnpm changeset pre exit               # removes pre.json
git add .changeset/pre.json
git commit -m "chore: exit changeset pre-release mode"
git push origin next

# Now open a PR: next → main, review the full v4 → v5 diff
# When merged, main's regular publish.yml picks up the accumulated changesets
# and publishes 5.0.0 stable (with --tag latest, default).
```

After the merge to main, optionally delete the `next` branch:

```sh
git branch -D next
git push origin --delete next
```

A fresh `next` branch can be re-created later for v6.

## Don't

- Don't run `npm publish` or `pnpm publish` directly. Always `pnpm changeset publish`.
- Don't skip `pnpm changeset version` — it's what does the actual version bump.
- Don't commit `.changeset/pre.json` deletions accidentally — that exits pre-mode silently.
- Don't push to `origin/main` from `next` without going through the proper "exit pre-mode → merge PR" flow.
- Don't run this skill on `main` — `main` has its own auto-publish flow.

## Related

- Changesets pre-release docs: <https://github.com/changesets/changesets/blob/main/docs/prereleases.md>
- envapt `.changeset/config.json` — the changesets configuration.
- envapt's regular publish workflow: `.github/workflows/publish.yml` (triggers on `main` only).
- The v5 branch + pre-release decision history: `.vscode/plan.md` §3 + §12.
