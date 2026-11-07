---
name: ship
description: Takes finished work through verification, review and a pull request. Use at the end of any change, including ones made without /devflow:feature or /devflow:bugfix. It verifies each repository that changed, checks CRAP, reviews in parallel, then opens the PR, or two linked PRs when both repositories changed.
allowed-tools: Bash(cat:*) Bash(node:*)
---

# /devflow:ship

## Project facts

!`cat .claude/devflow.json`

## Where the repositories stand

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/sync.mjs"`

## Conventions

!`cat "${CLAUDE_PLUGIN_ROOT}/shared/conventions.md"`

## Steps

Run each step in every repository that has changes on its branch. Stop at the first failure and report it with its output.

1. **Stay current.** The target is `main` for a `hotfix/*` or `release/*` branch, and `<baseBranch>` for any other. Rebase the branch on a freshly fetched `origin/<target>`. If the branch has commits from more than one author or was already reviewed, merge instead of rebasing. The commits behind `origin/<target>` must be zero before the PR. Work not yet committed blocks a rebase, so save it first: run `git status --short` and keep the output, `git stash push --include-untracked`, rebase (or merge), then `git stash pop`. Confirm `git stash list` is empty and `git status --short` equals what you saved. Never use `git reset`, `git checkout` or `git restore` to get past a dirty tree. On a conflict, stop: list the conflicted files and let the user decide (`git rebase --abort` restores the branch); do not resolve conflicts silently.
2. **Verify.** Run every command in `verify`, in order, and read the output. Then run `crap` if the file has one. Each method at 15 or above is fixed with a test or a split, and the check runs again until it reports none.
3. **Contract.** If the backend changed, run `/devflow:api-sync` and keep the frontend green against it. Then run `verify` again in the frontend and read the output: the generated types were not covered by step 2, and the PR is not ready until it passes.
4. ⏸ **Review.** Start three read-only reviewers in the same turn: simplicity and reuse, bugs, and the conventions in the repository's `CLAUDE.md` and rules. Collect their findings and check each against the code. List the ones that hold, and wait for the user to say which to apply. Apply them one at a time, verifying after each.
5. **Docs.** Update the docs the change affects, following the repository's own instructions. If the change adds, finishes or changes the status of a feature, update the docs index too.
6. ⏸ **Commit and push.** Show the commit message and the PR title and body. Wait for approval. Then commit with Conventional Commits, run the repository's `lint` (it must pass), and push the branch with `git push -u origin <branch>`.
7. **Open the PR** with `gh pr create` to `<target>`. For a `hotfix/*` or `release/*` branch also open a second PR from the same branch to `<baseBranch>`, so the change is not lost, and say that both exist. The body says what changes, why, the decisions that are not obvious and the risks a reviewer must look at. Check the diff's file count against what you expect; a much larger diff means a stale branch.
8. **Paired PRs.** When both repositories changed, each body links the other. The backend merges first (Parallel Change); say so in both. Never put unrelated work in the same PR.
9. **CI.** Run `gh pr checks <number> --watch` for each PR and read the step that failed. A PR is ready when CI is green, not when the local run is.
