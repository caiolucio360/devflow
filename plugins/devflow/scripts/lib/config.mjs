import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** The branch prefixes every devflow command accepts, the same set in both repositories. */
export const BRANCH_PREFIXES = ["feature", "fix", "refactor", "chore", "docs", "test", "release", "hotfix"];

const REQUIRED = ["role", "baseBranch", "verify"];

/** Throws a message that names the file and what is wrong; returns the config when it is usable. */
export function validate(config, file = ".claude/devflow.json") {
  const missing = REQUIRED.filter((key) => config[key] === undefined);
  if (missing.length > 0) throw new Error(`${file}: missing ${missing.join(", ")}`);
  const commands = config.verify;
  if (!Array.isArray(commands) || commands.length === 0 || !commands.every((c) => typeof c === "string")) {
    throw new Error(`${file}: "verify" must be a non-empty array of commands`);
  }
  if (config.sibling !== undefined && typeof config.sibling.path !== "string") {
    throw new Error(`${file}: "sibling.path" must be a string`);
  }
  return config;
}

/** Reads and validates `<root>/.claude/devflow.json`. */
export function loadConfig(root) {
  const file = path.join(root, ".claude", "devflow.json");
  if (!existsSync(file)) throw new Error(`${file} not found: add .claude/devflow.json (see the devflow README)`);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }
  return validate(parsed, file);
}

/** This repository, then its sibling when the config names one: `{ role, root }` each. */
export function repositories(root, config) {
  const own = { role: config.role, root: path.resolve(root) };
  if (!config.sibling) return [own];
  return [own, { role: config.sibling.role, root: path.resolve(root, config.sibling.path) }];
}
