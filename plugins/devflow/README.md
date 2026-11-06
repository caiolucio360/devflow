# devflow

Five commands that carry a change through two repositories, a backend and a frontend, the same way
every time: sync, plan, tests first, verify, review, ship.

They call the installed `superpowers` skills for the generic parts (brainstorming, plans, TDD,
debugging, verification) and add what is specific to two repositories: reading both, creating the
same branch in both, and merging in the right order. Each repository's own rules still apply.

| Command | In one line |
|---|---|
| `/devflow:feature` | New behaviour, from idea to pull requests |
| `/devflow:bugfix` | Fix existing behaviour at its root cause |
| `/devflow:api-sync` | Make the frontend agree with the backend contract |
| `/devflow:ship` | Verify, review and open the pull request |
| `/devflow:help` | List the commands or explain one |

A step marked ⏸ is an **approval point**: the command stops and asks, and goes on only after you say so.

## Installation

In each repository's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "devflow": { "source": { "source": "github", "repo": "caiolucio360/devflow-ai", "ref": "main" } }
  },
  "enabledPlugins": { "devflow@devflow": true },
  "permissions": { "additionalDirectories": ["<path to the other repository>"] }
}
```

To try it once without editing settings: `/plugin install devflow --marketplace caiolucio360/devflow-ai`.

`additionalDirectories` only gives file access to the sibling; the commands live in the plugin.
The plugin updates when `/plugin marketplace update devflow` runs, or automatically when auto-update
is on for the marketplace.

Each repository also commits `.claude/devflow.json`, the only place the plugin reads project facts:

| Key | Meaning |
|---|---|
| `role` | `frontend` or `backend`; the name used in reports |
| `sibling` | `{ "role", "path" }` of the other repository; the path is relative to this repository's root. Omit it for a single-repository project |
| `baseBranch` | The branch work starts from and PRs target (`dev`) |
| `verify` | Commands that must pass before a PR, run in order |
| `crap` | Command that fails when a method has CRAP of 15 or more |
| `contract` | `generate` produces the API contract (backend) or the types from it (frontend); `check` type-checks the frontend against it |
| `docs` | `repo` (where specs and plans live, relative to this repository), `specs`, `plans`, `index` |

Commands start from the root of a repository: they read `.claude/devflow.json` from the working
directory.

## /devflow:feature

`/devflow:feature <description>`

Takes new behaviour from idea to pull requests.

1. Sync: fetch both repositories and report how far each is behind `origin/<baseBranch>`.
2. Discovery: read the docs index, specs and ADRs of the area.
3. Explore: one subagent per repository, in parallel.
4. ⏸ Questions and design (`superpowers:brainstorming`).
5. Create the same branch in both repositories.
6. ⏸ Plan in `docs.plans`, with an automated and a manual check per task.
7. Backend first, tests first, adding the new shape only.
8. `/devflow:api-sync`.
9. Frontend, tests first, migrating to the new shape.
10. `/devflow:ship`.

**Approval points:** the design and the plan.
**Use when:** new behaviour, a change in both repositories, an architecture decision, three or more files.
**Do not use when:** the change is small and already defined (do it directly, then `/devflow:ship`) or it is a bug (`/devflow:bugfix`).
**Example:** `/devflow:feature add a currency selector to the seller page`.

## /devflow:bugfix

`/devflow:bugfix <issue number or description>`

Fixes existing behaviour at its root cause.

1. Sync.
2. Reproduce the bug; if it cannot be reproduced, stop and ask.
3. Find the repository and line where the wrong value is born.
4. Branch `fix/<name>`, or `hotfix/<name>` from `main` when the bug is in production and urgent.
5. Write the regression test and watch it fail.
6. Minimal fix.
7. Prove the test: revert the fix, the test must fail, restore the fix, it must pass.
8. `/devflow:ship`.

**Approval points:** none of its own; `/devflow:ship` has them.
**Use when:** existing behaviour is wrong.
**Do not use when:** the "bug" is a new requirement (`/devflow:feature`).
**Example:** `/devflow:bugfix the checkout total ignores the freight`.

## /devflow:api-sync

`/devflow:api-sync`

Makes the frontend agree with the backend contract.

1. Generate the contract in the backend and report whether it differs from `origin/<baseBranch>`;
   an unchanged contract is reported, not a reason to stop.
2. Regenerate the frontend types and type-check, always.
3. List what broke, by file, with what each place must do.

**Approval points:** none.
**Use when:** the backend changed an endpoint or a DTO, or to check the two repositories agree.
**Do not use when:** the change does not touch the API.
**Example:** after adding a field to a response DTO in the backend.

## /devflow:ship

`/devflow:ship`

Ends any change: verification, review, pull request.

1. Rebase on a fresh `origin/<target>`, where the target is `main` for `hotfix/*` and `release/*`
   and `<baseBranch>` otherwise. Uncommitted work is stashed first and restored after; a conflict
   stops the command and the user decides.
2. Run `verify`, then `crap`; fix every method at 15 or above.
3. `/devflow:api-sync` when the backend changed, then `verify` again in the frontend.
4. ⏸ Three reviewers in parallel (simplicity, bugs, conventions); the user picks what to apply.
5. Update the docs the change affects.
6. ⏸ Show the commit and PR text; then commit, lint, push.
7. Open the PR to the target. A `hotfix/*` or `release/*` branch also gets a second PR to
   `<baseBranch>`. When both repositories changed, two PRs that link each other; the backend merges
   first.
8. Watch CI to green.

**Approval points:** the review findings and the push.
**Use when:** the end of any change, including one made without `feature` or `bugfix`.
**Example:** after a two-file fix made by hand.

## /devflow:help

`/devflow:help [command]`

Without an argument, lists every command with one line and the situation table below. With a
command name, shows that command's section. It answers from this README.

**Use when:** unsure which command fits; onboarding.

## Which command

| Situation | Command |
|---|---|
| New behaviour, a feature, a change in both repositories | `/devflow:feature` |
| Something that worked is wrong | `/devflow:bugfix` |
| The backend changed a DTO or an endpoint | `/devflow:api-sync` |
| Work is done and must become a PR | `/devflow:ship` |
| A small change you can make directly | Make it, then `/devflow:ship` |
| Not sure | `/devflow:help` |

## Rules the commands enforce

- **CRAP below 15** for every method. A fix is a test or lower complexity, never an exclusion.
- **Parallel Change** across repositories: the backend adds the new shape and merges first, the
  frontend migrates, a later backend PR removes the old shape.
- **Branch prefixes** `feature fix refactor chore docs test release hotfix`, kebab-case, the same
  name in both repositories. A branch is created from a fresh `origin/<baseBranch>` with no upstream.
- **Verification before a PR:** every `verify` command run and its output read; CI green before a PR
  counts as ready.
- **No attribution trailers** in commits or PRs.

## Adding a command

1. Create `plugins/devflow/skills/<name>/SKILL.md` with `name`, a `description` that says when to
   use it and when not to, and phases that name the approval points.
2. Add a `## /devflow:<name>` section to this README. `scripts/check-readme.sh` fails CI without it.
3. Put what several commands share in `plugins/devflow/shared/`, and inject it with
   `` !`cat "${CLAUDE_PLUGIN_ROOT}/shared/<file>.md"` ``.
4. Put logic that must be exact in `plugins/devflow/scripts/` with a test in `test/`, not in prose.
