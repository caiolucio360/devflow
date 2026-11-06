#!/usr/bin/env node
// Creates the same branch, from a freshly fetched origin/<from>, in this repository and its sibling.
// Usage: node branch.mjs <prefix>/<kebab-name> [--from <branch>] [--root <dir>]
import { pathToFileURL } from "node:url";
import { BRANCH_PREFIXES, loadConfig, repositories } from "./lib/config.mjs";
import { git } from "./lib/git.mjs";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** `feature/order-timeline` is valid; `feat/x`, `feature/Order_Timeline` and `main` are not. */
export function assertBranchName(name) {
  const [prefix, slug, ...extra] = name.split("/");
  if (!BRANCH_PREFIXES.includes(prefix) || !slug || extra.length > 0 || !KEBAB.test(slug)) {
    throw new Error(`"${name}" is not <prefix>/<kebab-case>; prefixes: ${BRANCH_PREFIXES.join(", ")}`);
  }
}

/** Refuses a dirty tree or an existing branch, so nothing is created halfway. */
function assertReady(repo, name) {
  if (git(repo.root, "status", "--porcelain") !== "") {
    throw new Error(`${repo.role} (${repo.root}) has uncommitted changes; commit or stash them first`);
  }
  if (git(repo.root, "branch", "--list", name) !== "") {
    throw new Error(`${repo.role} (${repo.root}) already has a branch named ${name}`);
  }
}

/** Fetches origin and confirms origin/<base> resolves, so no switch runs against a stale or missing ref. */
function assertBaseReachable(repo, base) {
  try {
    git(repo.root, "fetch", "origin", "--quiet");
  } catch (error) {
    throw new Error(`${repo.role} (${repo.root}) cannot fetch origin: ${error.message}`);
  }
  try {
    git(repo.root, "rev-parse", "--verify", "--quiet", `origin/${base}`);
  } catch {
    throw new Error(`${repo.role} (${repo.root}) has no origin/${base}`);
  }
}

function create(repo, name, from) {
  git(repo.root, "switch", "-c", name, `origin/${from}`);
  // Created from origin/<from>, git tracks it; a push would then target the base branch.
  git(repo.root, "branch", "--unset-upstream");
}

/**
 * Checks every repository before the first `switch -c`: each must be clean, lack the branch, fetch
 * and have origin/<base>. If any check fails, nothing is created in any repository.
 * Not guaranteed: a git failure during `create` itself, after all checks passed, can leave the
 * repositories before the failing one on the new branch. Nothing is rolled back.
 */
export function createPaired(root, name, from) {
  assertBranchName(name);
  const config = loadConfig(root);
  const repos = repositories(root, config);
  const base = from ?? config.baseBranch;
  repos.forEach((repo) => assertReady(repo, name));
  repos.forEach((repo) => assertBaseReachable(repo, base));
  repos.forEach((repo) => create(repo, name, base));
  return repos.map((repo) => `${repo.role}: ${name} from origin/${base}`);
}

function parse(argv) {
  const options = { name: undefined, from: undefined, root: process.cwd() };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--from") options.from = argv[++i];
    else if (argv[i] === "--root") options.root = argv[++i];
    else options.name = argv[i];
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { name, from, root } = parse(process.argv.slice(2));
    if (!name) throw new Error("usage: branch.mjs <prefix>/<kebab-name> [--from <branch>]");
    console.log(createPaired(root, name, from).join("\n"));
  } catch (error) {
    console.error(`devflow branch failed: ${error.message}`);
    process.exitCode = 1;
  }
}
