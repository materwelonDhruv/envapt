---
name: cs-prerelease
description: Release envapt through changesets pre mode. Cut a prerelease from the long-lived `next` branch, graduate it to a stable release on `main`, then re-sync `next`. Use for any envapt release on the `next` line.
---

# Releasing envapt (prerelease, graduate, re-sync)

## Mental model

- `next` is the prerelease line. Its publishes go to the `next` dist-tag as `X.Y.Z-next.N`.
- `main` is stable. Its publishes go to `latest` as a clean `X.Y.Z`.
- CI (`.github/workflows/publish.yml`) publishes on a push to `main` or `next` when no changesets are pending. If you push changeset files without versioning, it opens a "Version Packages" PR instead. To skip that PR, version locally before you push (the flows below do this).
- `scripts/release/release-preflight.ts` refuses a publish whose branch, pre mode, tag, and version disagree, so a clean version can never reach the `next` tag.
- A published version is permanent on npm. Only the dist-tag can move.

## Flow 1, cut a prerelease from `next`

Version locally so the push publishes straight to the `next` tag with no Version Packages PR.

```sh
git switch next && git pull
pnpm cs:status                       # what will bump, and to which version
pnpm release:version                 # bump to X.Y.Z-next.N and sync deno.json
pnpm install                         # update the lockfile if it changed
git commit -am "chore: version X.Y.Z-next.N"
git push origin next                 # no changesets pending, so CI publishes, no PR
npm dist-tag ls envapt               # next moved, latest unchanged
```

## Flow 2, graduate `next` to stable

Run when the prerelease is ready to become the stable release. Do it on `main` so the clean version reaches `latest`. Exiting pre mode and versioning on `next` would ship a clean version to the `next` tag, which is the bug the preflight guard blocks.

```sh
git switch main && git pull
git merge next                       # resolve any changelog or pre.json conflicts
pnpm changeset pre exit              # leave pre mode on main
pnpm release:version                 # write the clean X.Y.Z and sync deno.json
pnpm install                         # update the lockfile
git commit -am "chore(release): vX.Y.Z"
git push origin main
```

Then **wait for the `main` publish workflow to finish green**, because CI does the actual publish. If `main` is branch-protected, do the same steps on a branch and merge the PR instead of pushing.

```sh
npm dist-tag ls envapt               # latest now points at X.Y.Z
```

## Flow 3, re-sync `next` after a graduation

Bring the clean version back and re-enter pre mode for the next cycle.

```sh
git switch next && git pull
git merge main                       # brings the clean X.Y.Z and changelog
pnpm changeset pre enter next        # re-enter pre mode
git commit -am "chore: re-enter pre mode"
git push origin next
```

This push publishes nothing (the version is already on `latest`), so the preflight guard lets it through. `next` now rests at the clean `X.Y.Z` in pre mode, ready for the next prerelease.

## If a publish lands on the wrong tag

Move the tag. You cannot delete or replace the version itself.

```sh
npm dist-tag add envapt@X.Y.Z latest    # point latest at the intended version
npm dist-tag ls envapt
```

## Don't

- Don't run `changeset pre exit` or `changeset version` on `next` to make a stable release. Graduate on `main` (Flow 2). A clean version on `next` ships to the `next` tag.
- Don't run `npm publish` or `pnpm publish` by hand. CI publishes through changesets.
- Don't push `main` while it is in pre mode. Exit pre mode first.

## Related

- Changesets prerelease docs, <https://github.com/changesets/changesets/blob/main/docs/prereleases.md>
- The publish workflow, `.github/workflows/publish.yml`, and its gate, `scripts/release/release-preflight.ts`.
