#!/usr/bin/env node
// Prints how far each repository is from origin/<baseBranch>, after fetching. Injected by the
// commands with !`node "${CLAUDE_PLUGIN_ROOT}/scripts/sync.mjs"` so it never depends on the model.
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { loadConfig, repositories } from "./lib/config.mjs";
import { git } from "./lib/git.mjs";

/** Fetches and measures one repository against `origin/<base>`. Never throws: problems become `note`. */
export function measure(repo, base) {
  if (!existsSync(repo.root)) return { ...repo, note: "directory not found" };
  const row = { ...repo, base };
  try {
    git(repo.root, "fetch", "origin", "--quiet");
  } catch (error) {
    row.note = `fetch failed (${error.message.split(": ").pop()}); numbers may be stale`;
  }
  try {
    row.branch = git(repo.root, "rev-parse", "--abbrev-ref", "HEAD");
    row.behind = Number(git(repo.root, "rev-list", "--count", `HEAD..origin/${base}`));
    row.ahead = Number(git(repo.root, "rev-list", "--count", `origin/${base}..HEAD`));
    row.dirty = git(repo.root, "status", "--porcelain") !== "";
  } catch (error) {
    row.note = error.message;
  }
  return row;
}

function describe(row) {
  if (row.behind === undefined) return `${row.role} (${row.root}): ${row.note}`;
  const state = row.behind === 0 ? "up to date" : `${row.behind} behind`;
  const flags = [row.ahead > 0 && `${row.ahead} ahead`, row.dirty && "uncommitted changes", row.note].filter(Boolean);
  const tail = flags.length > 0 ? `; ${flags.join("; ")}` : "";
  return `${row.role} (${row.root}): on ${row.branch}, ${state} of origin/${row.base}${tail}`;
}

/** One line per repository, plus a warning line when anything needs attention before work starts. */
export function report(rows) {
  const lines = rows.map(describe);
  const stale = rows.some((r) => r.behind > 0 || r.dirty || r.note);
  if (stale) lines.push("Attention: bring each repository up to date and clean before creating the branch.");
  return lines.join("\n");
}

export function run(root) {
  const config = loadConfig(root);
  const rows = repositories(root, config).map((repo) => measure(repo, config.baseBranch));
  return report(rows);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(run(process.argv[2] ?? process.cwd()));
  } catch (error) {
    console.log(`devflow sync failed: ${error.message}`);
    process.exitCode = 1;
  }
}
