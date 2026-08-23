# Git workflow

## Branches

- `main` — always deployable. Protected: no direct pushes, PRs only.
- `feat/<short-name>` — new functionality (e.g. `feat/owner-dashboard`)
- `fix/<short-name>` — bug fixes (e.g. `fix/inquiry-form-validation`)
- `chore/<short-name>` — tooling, deps, config, docs

## Daily habit

1. `git checkout main && git pull`
2. `git checkout -b feat/whatever-you're-building`
3. Commit as you go, small and often. Write commit messages as *why*, not *what*:
   good: `fix: handle missing venue slug in inquiry form`
   avoid: `update VenueDetail.jsx`
4. `git push -u origin feat/whatever-you're-building`
5. Open a PR into `main` (`gh pr create` or the GitHub web UI). Fill in the
   template — what changed, why, how you tested it.
6. Get it reviewed (self-review is fine solo, but actually re-read your own
   diff before merging). Merge with **Squash and merge** to keep `main`'s
   history one commit per feature.
7. Delete the branch after merge (`git branch -d` locally, GitHub does it
   remotely on squash-merge if you tick "auto-delete branches" in repo
   settings).

## Why this matters

Direct commits to `main` are how "it works on my machine" turns into a
broken `main` for the other person on the team. A PR — even a
self-reviewed one — is a forced pause to re-read the diff before it lands.
