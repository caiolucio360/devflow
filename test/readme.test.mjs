import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "scripts", "check-readme.sh");

/** A repository root with the given skills and a README holding the given text. */
function fixture(skills, readme) {
  const root = mkdtempSync(path.join(tmpdir(), "devflow-readme-"));
  mkdirSync(path.join(root, "plugins", "devflow"), { recursive: true });
  for (const skill of skills) mkdirSync(path.join(root, "plugins", "devflow", "skills", skill), { recursive: true });
  writeFileSync(path.join(root, "plugins", "devflow", "README.md"), readme);
  return root;
}

const check = (root) => spawnSync("bash", [script, root], { encoding: "utf8" });

describe("check-readme.sh", () => {
  it("passes when every skill has its section", () => {
    const root = fixture(["feature", "help"], "# devflow\n## /devflow:feature\ntext\n## /devflow:help [command]\ntext\n");
    const result = check(root);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });

  it("fails and names the skill whose section was deleted", () => {
    const root = fixture(["feature", "help"], "# devflow\n## /devflow:help\ntext\n");
    const result = check(root);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /no "## \/devflow:feature" section/);
  });

  it("does not take a longer name for a shorter one", () => {
    const root = fixture(["ship"], "# devflow\n## /devflow:shipping\ntext\n");
    assert.equal(check(root).status, 1);
  });

  it("passes when there is no skills directory yet", () => {
    const root = fixture([], "# devflow\n");
    const result = check(root);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});
