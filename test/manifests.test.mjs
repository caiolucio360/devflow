import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { check } from "../scripts/check-manifests.mjs";

/** A repository root whose marketplace lists one plugin; `manifest` is the plugin's own plugin.json text. */
function fixture({ entryName = "devflow", manifest = '{ "name": "devflow" }' } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "devflow-manifests-"));
  mkdirSync(path.join(root, ".claude-plugin"));
  mkdirSync(path.join(root, "plugins", "devflow", ".claude-plugin"), { recursive: true });
  const marketplace = { name: "devflow", plugins: [{ name: entryName, source: "./plugins/devflow" }] };
  writeFileSync(path.join(root, ".claude-plugin", "marketplace.json"), JSON.stringify(marketplace));
  writeFileSync(path.join(root, "plugins", "devflow", ".claude-plugin", "plugin.json"), manifest);
  return root;
}

describe("check", () => {
  it("accepts a marketplace whose entry matches the plugin manifest", () => {
    assert.deepEqual(check(fixture()), []);
  });

  it("names the mismatch between the entry and the manifest", () => {
    const problems = check(fixture({ entryName: "devflow-tools" }));
    assert.deepEqual(problems, ['marketplace entry "devflow-tools" points at a plugin named "devflow"']);
  });

  it("reports a manifest that is not valid JSON", () => {
    const problems = check(fixture({ manifest: "{ nope" }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /plugin\.json/);
  });

  it("reports a missing marketplace file", () => {
    const problems = check(mkdtempSync(path.join(tmpdir(), "devflow-empty-")));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /marketplace\.json/);
  });
});
