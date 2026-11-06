import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const IDENTITY = ["-c", "user.name=Test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false"];

export function git(cwd, ...args) {
  return execFileSync("git", [...IDENTITY, ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

export function commit(cwd, file, text, message = "change") {
  writeFileSync(path.join(cwd, file), text);
  git(cwd, "add", file);
  git(cwd, "commit", "-q", "-m", message);
}

/** A bare `origin` with a `dev` branch (one commit) and a clone of it at `<parent>/<name>`. */
export function makeRepo(parent, name) {
  const origin = path.join(parent, `${name}-origin.git`);
  const seed = path.join(parent, `${name}-seed`);
  mkdirSync(origin);
  git(origin, "init", "-q", "--bare", "-b", "dev");
  mkdirSync(seed);
  git(seed, "init", "-q", "-b", "dev");
  commit(seed, "README.md", "seed", "seed");
  git(seed, "remote", "add", "origin", origin);
  git(seed, "push", "-q", "origin", "dev");
  const clone = path.join(parent, name);
  git(parent, "clone", "-q", origin, clone);
  return { origin, seed, clone };
}

/** Front and back clones side by side, the front's `.claude/devflow.json` pointing at `../back`. */
export function makeWorkspace() {
  const parent = mkdtempSync(path.join(tmpdir(), "devflow-"));
  const front = makeRepo(parent, "front");
  const back = makeRepo(parent, "back");
  mkdirSync(path.join(front.clone, ".claude"));
  const config = {
    role: "frontend",
    sibling: { role: "backend", path: "../back" },
    baseBranch: "dev",
    verify: ["npm run lint"],
  };
  writeFileSync(path.join(front.clone, ".claude", "devflow.json"), JSON.stringify(config));
  git(front.clone, "add", ".claude");
  git(front.clone, "commit", "-q", "-m", "devflow config");
  git(front.clone, "push", "-q", "origin", "dev");
  return { parent, front, back, config };
}
