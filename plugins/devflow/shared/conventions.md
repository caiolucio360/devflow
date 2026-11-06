# devflow conventions

Every devflow command follows these.

**Gates.** A step marked ⏸ ends with a question. Do not go on until the user approves. Nothing is pushed, no PR is opened and no plan is executed before its gate, whoever started the command.

**Evidence.** A step is done when its command ran in this turn and you read the output. Report what ran and what it printed. A failing test is reported with its failure; a skipped step is reported with the reason.

**Config.** Project facts come from `.claude/devflow.json`. `sibling.path` is relative to this repository's root. Specs, plans and the docs index live in the repository named by `docs.repo`.

**Branches.** `<prefix>/<kebab-case>`, prefix one of `feature fix refactor chore docs test release hotfix` (never `feat/`). A change in both repositories uses the same name in both:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/branch.mjs" <prefix>/<name> [--from <branch>]
```

It refuses a dirty tree or an existing branch, creates the branch from a freshly fetched `origin/<baseBranch>` (or `--from`), and clears the upstream so a push never lands on the base branch. A change in one repository only: `git fetch origin && git switch -c <name> origin/<baseBranch> && git branch --unset-upstream` there. `hotfix/*` starts from `main` (`--from main`) and its PR goes to `main` and back to `dev`.

**Order across repositories (Parallel Change).** Expand, migrate, contract. The backend adds the new shape next to the old one and merges first. The frontend then migrates to it. Removing the old shape is a later backend PR. Never remove or rename something the frontend still reads in the same PR that adds its replacement.

**Quality.** Every method has CRAP below 15; the `crap` command of `devflow.json` measures it. A fix is a test or lower complexity, never an exclusion. A contract mismatch is never silenced with `as`, `!` or `any`.

**Commits and PRs.** Conventional Commits (`feat fix docs style refactor test chore`), imperative lowercase subject, about 72 characters. No `Co-Authored-By` and no "Generated with" line. A PR targets `baseBranch`; only `release/*` and `hotfix/*` target `main`.
