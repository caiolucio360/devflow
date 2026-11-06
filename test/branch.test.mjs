import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { assertBranchName, createPaired } from "../plugins/devflow/scripts/branch.mjs";
import { commit, git, makeWorkspace } from "./helpers.mjs";

describe("assertBranchName", () => {
  it("accepts every prefix with a kebab-case name", () => {
    for (const prefix of ["feature", "fix", "refactor", "chore", "docs", "test", "release", "hotfix"]) {
      assert.doesNotThrow(() => assertBranchName(`${prefix}/order-timeline`));
    }
  });

  it("rejects the legacy prefix, bad casing, missing or extra segments", () => {
    for (const bad of ["feat/x", "feature/Order_Timeline", "feature/", "feature", "dev", "feature/a/b", "feature/a--b", "fix/-a"]) {
      assert.throws(() => assertBranchName(bad), /is not <prefix>\/<kebab-case>/, bad);
    }
  });
});

describe("createPaired", () => {
  it("creates the same branch in both repositories from fresh origin/dev, without upstream", () => {
    const { front, back } = makeWorkspace();
    commit(back.seed, "late.txt", "late");
    git(back.seed, "push", "-q", "origin", "dev");

    const lines = createPaired(front.clone, "feature/currency-selector");

    assert.deepEqual(lines, [
      "frontend: feature/currency-selector from origin/dev",
      "backend: feature/currency-selector from origin/dev",
    ]);
    for (const repo of [front, back]) {
      assert.equal(git(repo.clone, "rev-parse", "--abbrev-ref", "HEAD"), "feature/currency-selector");
      assert.throws(() => git(repo.clone, "rev-parse", "--abbrev-ref", "@{upstream}"), "no upstream, so a push cannot land on dev");
    }
    assert.equal(
      git(back.clone, "rev-parse", "HEAD"),
      git(back.clone, "rev-parse", "origin/dev"),
      "the back branch starts from the commit fetched just now, not from the stale local dev",
    );
  });

  it("branches from another base when asked (hotfix from main)", () => {
    const { front, back } = makeWorkspace();
    for (const repo of [front, back]) {
      git(repo.seed, "push", "-q", "origin", "dev:main");
    }

    createPaired(front.clone, "hotfix/jwt-key", "main");

    assert.equal(git(front.clone, "rev-parse", "HEAD"), git(front.clone, "rev-parse", "origin/main"));
  });

  it("creates nothing when the sibling has uncommitted changes", () => {
    const { front, back } = makeWorkspace();
    writeFileSync(path.join(back.clone, "wip.txt"), "wip");

    assert.throws(() => createPaired(front.clone, "fix/typo"), /backend .* has uncommitted changes/);

    assert.equal(git(front.clone, "branch", "--list", "fix/typo"), "", "the front was not touched either");
  });

  it("creates nothing when the branch already exists in the sibling", () => {
    const { front, back } = makeWorkspace();
    git(back.clone, "branch", "fix/typo");

    assert.throws(() => createPaired(front.clone, "fix/typo"), /backend .* already has a branch named fix\/typo/);

    assert.equal(git(front.clone, "branch", "--list", "fix/typo"), "");
  });

  it("rejects an invalid name before touching anything", () => {
    const { front } = makeWorkspace();
    assert.throws(() => createPaired(front.clone, "feat/x"), /is not <prefix>/);
  });
});
