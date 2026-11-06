import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { BRANCH_PREFIXES, loadConfig, repositories, validate } from "../plugins/devflow/scripts/lib/config.mjs";

const valid = { role: "frontend", baseBranch: "dev", verify: ["npm run lint"] };

function repoWith(content) {
  const root = mkdtempSync(path.join(tmpdir(), "devflow-config-"));
  mkdirSync(path.join(root, ".claude"));
  if (content !== undefined) writeFileSync(path.join(root, ".claude", "devflow.json"), content);
  return root;
}

describe("validate", () => {
  it("accepts a config with the required keys", () => {
    assert.equal(validate(valid), valid);
  });

  it("names every missing key and the file", () => {
    assert.throws(() => validate({ role: "frontend" }, "x.json"), /x\.json: missing baseBranch, verify/);
  });

  it("rejects an empty or non-string verify list", () => {
    assert.throws(() => validate({ ...valid, verify: [] }), /non-empty array/);
    assert.throws(() => validate({ ...valid, verify: [1] }), /non-empty array/);
    assert.throws(() => validate({ ...valid, verify: "npm test" }), /non-empty array/);
  });

  it("rejects a sibling without a path", () => {
    assert.throws(() => validate({ ...valid, sibling: { role: "backend" } }), /sibling\.path/);
  });
});

describe("loadConfig", () => {
  it("reads .claude/devflow.json", () => {
    const root = repoWith(JSON.stringify(valid));
    assert.deepEqual(loadConfig(root), valid);
  });

  it("explains a missing file", () => {
    assert.throws(() => loadConfig(repoWith(undefined)), /not found: add \.claude\/devflow\.json/);
  });

  it("explains invalid JSON", () => {
    assert.throws(() => loadConfig(repoWith("{ nope")), /is not valid JSON/);
  });
});

describe("repositories", () => {
  it("is just this repository without a sibling", () => {
    assert.deepEqual(repositories("/work/front", valid), [{ role: "frontend", root: path.resolve("/work/front") }]);
  });

  it("resolves the sibling relative to this repository", () => {
    const config = { ...valid, sibling: { role: "backend", path: "../back" } };
    const [own, sibling] = repositories("/work/front", config);
    assert.equal(own.root, path.resolve("/work/front"));
    assert.deepEqual(sibling, { role: "backend", root: path.resolve("/work/back") });
  });
});

describe("BRANCH_PREFIXES", () => {
  it("is the front's set, without the legacy feat/", () => {
    assert.deepEqual(BRANCH_PREFIXES, ["feature", "fix", "refactor", "chore", "docs", "test", "release", "hotfix"]);
  });
});
