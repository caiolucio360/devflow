---
name: feature
description: Builds a feature across the backend and frontend repositories, with a plan, tests first and approval gates. Use for new behaviour, anything that touches both repositories, an architecture decision, or a change of three or more files. Do not use for a small, already-defined change (do it directly, then run /devflow:ship) or for a bug (use /devflow:bugfix).
argument-hint: "<description of the feature>"
---

# /devflow:feature

Feature: $ARGUMENTS

## Project facts

!`cat .claude/devflow.json`

## Where the repositories stand

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/sync.mjs"`

## Conventions

!`cat "${CLAUDE_PLUGIN_ROOT}/shared/conventions.md"`

## Phases

Skip a phase that does not apply (a feature in one repository has nothing to sync across).

1. **Sync.** Read the report above. If a repository is behind `origin/<baseBranch>` or has uncommitted changes, say so and wait until the user fixes it or says to go on.
2. **Discovery.** Read the docs index (`docs.index` in the repository `docs.repo`) and the specs and ADRs of the area. An ADR that already rejected an alternative is not proposed again.
3. **Explore in parallel.** One read-only subagent per repository, started in the same turn. Each reports the files, endpoints, tests and risks the feature touches. Wait for both.
4. ⏸ **Questions and design.** Follow `superpowers:brainstorming`: one question at a time, two or three approaches with a recommendation. The spec goes under `docs.specs`, not under `docs/superpowers/`. Stop until the user approves the design.
5. **Branches.** Create the branch as the conventions describe, in both repositories or in the one that changes.
6. ⏸ **Plan.** Follow `superpowers:writing-plans`, saving to `docs.plans/<feature>.md`. Every task lists the automated check (an exact command) and the manual check (what to open and what to see). Stop until the user approves the plan.
7. **Backend, expand only.** Follow `superpowers:test-driven-development` in the backend: the failing test, the minimal code, `verify` and `crap` from its `devflow.json`. Add the new shape; do not remove the old one. Mark the plan task completed.
8. **Contract.** Run `/devflow:api-sync`. A type error in the frontend is the list of what to migrate.
9. **Frontend.** The same cycle in the frontend, migrating to the new shape. A UI change is opened in the browser and checked before it counts as done.
10. **Ship.** Run `/devflow:ship`.

If a phase fails, stop and report the failure with its output. Do not weaken a test, raise a timeout or skip a check to get past it.
