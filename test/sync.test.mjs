import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { measure, report, run } from "../plugins/devflow/scripts/sync.mjs";
import { commit, git, makeWorkspace } from "./helpers.mjs";

describe("measure", () => {
  it("reports a clean repository as up to date", () => {
    const { front } = makeWorkspace();
    const row = measure({ role: "frontend", root: front.clone }, "dev");
    assert.equal(row.branch, "dev");
    assert.equal(row.behind, 0);
    assert.equal(row.ahead, 0);
    assert.equal(row.dirty, false);
  });

  it("counts commits that reached origin after the last pull", () => {
    const { back } = makeWorkspace();
    commit(back.seed, "a.txt", "a");
    commit(back.seed, "b.txt", "b");
    git(back.seed, "push", "-q", "origin", "dev");

    const row = measure({ role: "backend", root: back.clone }, "dev");

    assert.equal(row.behind, 2, "the fetch inside measure sees the new commits");
  });

  it("counts local commits ahead and uncommitted changes", () => {
    const { front } = makeWorkspace();
    commit(front.clone, "local.txt", "x");
    writeFileSync(path.join(front.clone, "wip.txt"), "wip");

    const row = measure({ role: "frontend", root: front.clone }, "dev");

    assert.equal(row.ahead, 1);
    assert.equal(row.dirty, true);
  });

  it("notes a missing sibling directory instead of throwing", () => {
    const row = measure({ role: "backend", root: path.join("nowhere", "back") }, "dev");
    assert.equal(row.note, "directory not found");
  });

  it("keeps measuring when the fetch fails, and says so", () => {
    const { front } = makeWorkspace();
    git(front.clone, "remote", "set-url", "origin", path.join(front.clone, "no-such-remote"));

    const row = measure({ role: "frontend", root: front.clone }, "dev");

    assert.match(row.note, /fetch failed/);
    assert.equal(row.behind, 0);
  });
});

describe("report", () => {
  it("says nothing needs attention when both repositories are current and clean", () => {
    const text = report([
      { role: "frontend", root: "/f", base: "dev", branch: "dev", behind: 0, ahead: 0, dirty: false },
      { role: "backend", root: "/b", base: "dev", branch: "dev", behind: 0, ahead: 0, dirty: false },
    ]);
    assert.match(text, /frontend \(\/f\): on dev, up to date of origin\/dev/);
    assert.doesNotMatch(text, /Attention/);
  });

  it("warns when a repository is behind or dirty", () => {
    const text = report([
      { role: "frontend", root: "/f", base: "dev", branch: "dev", behind: 3, ahead: 1, dirty: true },
    ]);
    assert.match(text, /3 behind of origin\/dev; 1 ahead; uncommitted changes/);
    assert.match(text, /Attention: bring each repository up to date/);
  });

  it("prints a row without numbers as its note", () => {
    const text = report([{ role: "backend", root: "/b", note: "directory not found" }]);
    assert.match(text, /backend \(\/b\): directory not found/);
    assert.match(text, /Attention/);
  });
});

describe("run", () => {
  it("measures this repository and its sibling from devflow.json", () => {
    const { front, back } = makeWorkspace();
    commit(back.seed, "new.txt", "n");
    git(back.seed, "push", "-q", "origin", "dev");

    const text = run(front.clone);

    assert.match(text, /frontend .*up to date/);
    assert.match(text, /backend .*1 behind of origin\/dev/);
  });
});
