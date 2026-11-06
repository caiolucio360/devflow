import { execFileSync } from "node:child_process";

/** Runs `git <args>` in `cwd` and returns trimmed stdout. Throws with git's own message on failure. */
export function git(cwd, ...args) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    const detail = String(error.stderr || error.message).trim();
    throw new Error(`git ${args.join(" ")} (in ${cwd}): ${detail}`);
  }
}
