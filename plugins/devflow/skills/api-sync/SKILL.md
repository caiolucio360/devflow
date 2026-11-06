---
name: api-sync
description: Brings the frontend's API types in line with the backend contract and lists what broke. Use when the backend changed an endpoint or DTO, or to check that the two repositories agree. Do not use for changes that do not touch the API.
---

# /devflow:api-sync

## Project facts

!`cat .claude/devflow.json`

## Conventions

!`cat "${CLAUDE_PLUGIN_ROOT}/shared/conventions.md"`

## Steps

The repository with `"role": "backend"` is the backend; the frontend is the other one, whether this session started in one or the other (`sibling.path` locates it).

1. **Generate the contract in the backend.** In the backend repository run `contract.generate` from its `devflow.json`. The contract file is whatever file or files that command changes. Then run `git status --short` and `git diff --stat origin/<baseBranch>` in the backend and report whether the contract differs from `origin/<baseBranch>`, committed or not, naming the files. Unchanged is a result to report, not a reason to stop: go on to step 2 either way.
2. **Regenerate the frontend types.** In the frontend repository run `contract.generate`, then `contract.check`.
3. **List what broke.** Group the errors by file. For each, say which field or endpoint changed and what the frontend code must do. Expand-only backend changes break nothing; an error means the old shape was removed too early, and that goes back to the backend first.
4. **Report.** What changed in the contract, what the frontend must migrate, and the commands that ran with their results.

Fix the frontend by migrating to the generated type. Never by `as`, `!` or `any`.
