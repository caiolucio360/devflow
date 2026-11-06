---
name: bugfix
description: Fixes a bug at its root cause with a regression test proved to fail without the fix. Use when existing behaviour is wrong. Do not use when the "bug" is a new requirement (use /devflow:feature). For a bug already in production that cannot wait for the next release, the command works on a hotfix branch from main.
argument-hint: "<issue number or description>"
---

# /devflow:bugfix

Bug: $ARGUMENTS

## Project facts

!`cat .claude/devflow.json`

## Where the repositories stand

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/sync.mjs"`

## Conventions

!`cat "${CLAUDE_PLUGIN_ROOT}/shared/conventions.md"`

## Phases

1. **Sync.** Read the report above. If a repository is behind or dirty, say so and wait.
2. **Reproduce.** Follow `superpowers:systematic-debugging`. If the argument is an issue number, read it with `gh issue view`. Reproduce the bug yourself and show the failing output. If you cannot reproduce it, stop and ask for the missing detail; a fix for a bug you have not seen is a guess.
3. **Locate the root cause.** Name the repository and the line where the wrong value is born. A fix at the place the symptom shows is a workaround; if a workaround is still the right choice, a comment says why.
4. **Branch.** `fix/<name>` from `<baseBranch>`, in the repository that holds the root cause. If the bug is in production and the next release is too far, say so to the user first, then branch from `main` in the repository that holds the root cause: `git fetch origin && git switch -c hotfix/<name> origin/main && git branch --unset-upstream`. Use `node "${CLAUDE_PLUGIN_ROOT}/scripts/branch.mjs" hotfix/<name> --from main` only when both repositories need the hotfix.
5. **Failing test first.** Write the regression test, run it and watch it fail for the reason in the bug report.
6. **Minimal fix.** The smallest change that makes the test pass. Adjacent problems are mentioned at the end, not fixed here.
7. **Prove the test.** The fix is uncommitted at this point, so revert it with a stash, never with `git checkout` or `git restore`, which destroy it. Save `git diff -- <fix files>` first. Run `git stash push -- <the fix files only, not the regression test>`, run the test (it must fail, for the same reason as in step 5), run `git stash pop`, run the test again (it must pass). Confirm `git stash list` is empty and `git diff -- <fix files>` equals the saved diff. Report all three results. This is the red-green proof from `superpowers:verification-before-completion`.
8. **Ship.** Run `/devflow:ship`.

If the root cause turns out to need a new endpoint or a changed contract, stop: that is a `/devflow:feature`. Say so and ask.
