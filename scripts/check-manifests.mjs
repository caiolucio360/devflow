#!/usr/bin/env node
// Fails when a manifest is not valid JSON or a marketplace entry names a different plugin than the
// plugin's own manifest (Claude Code refuses to install such a plugin).
// Usage: node check-manifests.mjs [repository root]
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Returns the list of problems; empty means the manifests are consistent. */
export function check(root) {
  const problems = [];
  const read = (relative) => {
    try {
      return JSON.parse(readFileSync(path.join(root, relative), "utf8"));
    } catch (error) {
      problems.push(`${relative}: ${error.message}`);
      return undefined;
    }
  };

  const marketplace = read(path.join(".claude-plugin", "marketplace.json"));
  if (!marketplace) return problems;
  if (!marketplace.plugins?.length) problems.push("marketplace.json lists no plugins");

  for (const entry of marketplace.plugins ?? []) {
    const manifest = read(path.join(entry.source, ".claude-plugin", "plugin.json"));
    if (manifest && manifest.name !== entry.name) {
      problems.push(`marketplace entry "${entry.name}" points at a plugin named "${manifest.name}"`);
    }
  }
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = check(process.argv[2] ?? process.cwd());
  problems.forEach((problem) => console.log(problem));
  process.exitCode = problems.length > 0 ? 1 : 0;
}
