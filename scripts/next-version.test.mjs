import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "child_process"
import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"

import { bumpLevel, computeVersion, latestStableTag, nextVersion } from "./next-version.mjs"

describe("latestStableTag", () => {
  test("picks the highest version, not the last listed", () => {
    assert.equal(latestStableTag(["4.1.0", "4.0.0", "3.3.2"]), "4.1.0")
    assert.equal(latestStableTag(["3.3.2", "4.1.0", "4.0.0"]), "4.1.0")
  })
  test("compares numerically", () => {
    assert.equal(latestStableTag(["1.0.9", "1.0.10"]), "1.0.10")
  })
  test("accepts an optional v", () => {
    assert.equal(latestStableTag(["v4.2.0", "4.1.0"]), "v4.2.0")
  })
  test("ignores pre-releases and other names", () => {
    assert.equal(latestStableTag(["5.0.0-rc.1", "escrow-2023", "4.1.0", ""]), "4.1.0")
  })
  test("returns undefined without a stable tag", () => {
    assert.equal(latestStableTag(["5.0.0-rc.1", "escrow-2023"]), undefined)
  })
})

describe("bumpLevel", () => {
  test("feat is a minor", () => {
    assert.equal(bumpLevel("feat(client): send stroke timing"), "minor")
    assert.equal(bumpLevel("feat: add a tool"), "minor")
  })
  test("! after the type or the scope is a major", () => {
    assert.equal(bumpLevel("fix(canvas)!: drop override.grabber"), "major")
    assert.equal(bumpLevel("refactor!: rename Editor"), "major")
  })
  test("a BREAKING CHANGE footer is a major", () => {
    assert.equal(bumpLevel("fix(canvas): rename\n\nBREAKING CHANGE: Editor is now Canvas"), "major")
    assert.equal(bumpLevel("docs: x\n\nBREAKING-CHANGE: y"), "major")
  })
  test("any other commit is a patch", () => {
    assert.equal(bumpLevel("fix(math): auto-compute"), "patch")
    assert.equal(bumpLevel("docs: README"), "patch")
    assert.equal(bumpLevel("not conventional at all"), "patch")
    assert.equal(bumpLevel("feature: not feat"), "patch")
  })
  test("Pull request merges and release commits do not count", () => {
    assert.equal(bumpLevel("Pull request #551: IIC-2163 hmac server signing"), undefined)
    assert.equal(bumpLevel("chore(release): 4.2.0 [skip ci]"), undefined)
  })
  test("reads the type after the [ai] prefix of a commit written by an AI agent", () => {
    assert.equal(bumpLevel("[ai] feat(canvas): add zoomToFit"), "minor")
    assert.equal(bumpLevel("[ai] fix(canvas)!: drop override.grabber"), "major")
    assert.equal(bumpLevel("[ai] fix(grabber): capture the pointer"), "patch")
    assert.equal(bumpLevel("[ai] chore(release): 4.2.0 [skip ci]"), undefined)
  })
})

describe("nextVersion", () => {
  test("the highest level wins", () => {
    assert.equal(nextVersion("4.1.0", ["fix: a", "docs: b"]), "4.1.1")
    assert.equal(nextVersion("4.1.3", ["fix: a", "feat: b"]), "4.2.0")
    assert.equal(nextVersion("4.1.3", ["feat: b", "fix!: a", "fix: c"]), "5.0.0")
  })
  test("drops the v of the tag", () => {
    assert.equal(nextVersion("v4.1.0", ["fix: a"]), "4.1.1")
  })
  test("no commit since the tag keeps the tag's version", () => {
    assert.equal(nextVersion("4.1.0", []), "4.1.0")
    assert.equal(nextVersion("4.1.0", ["Pull request #1: x"]), "4.1.0")
    assert.equal(nextVersion("4.1.0", ["chore(release): 4.1.0 [skip ci]"]), "4.1.0")
  })
  test("is the same version once its own release commit is on top", () => {
    const messages = ["feat: a", "Pull request #1: a"]
    const version = nextVersion("4.1.0", messages)
    assert.equal(nextVersion("4.1.0", [`chore(release): ${version} [skip ci]`, ...messages]), version)
  })
  test("rejects a tag that is not stable", () => {
    assert.throws(() => nextVersion("5.0.0-rc.1", []))
  })
})

describe("computeVersion", () => {
  const repo = mkdtempSync(join(tmpdir(), "next-version-"))
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf-8" })
  const commit = (message) => git("commit", "--allow-empty", "-q", "-m", message)

  git("init", "-q")
  git("config", "user.email", "ci@example.com")
  git("config", "user.name", "CI")
  git("config", "commit.gpgsign", "false")
  git("config", "tag.gpgsign", "false")
  // A machine-wide hooks path may reject the author above
  git("config", "core.hooksPath", "/dev/null")

  test("throws without a reachable stable tag", () => {
    commit("chore: init")
    assert.throws(() => computeVersion(repo), /No stable tag/)
  })
  test("starts from the latest reachable stable tag and skips pre-release tags", () => {
    git("tag", "4.1.0")
    commit("fix: a")
    git("tag", "4.1.1-rc.1")
    commit("feat: b")
    assert.equal(computeVersion(repo), "4.2.0")
  })
  test("reads the BREAKING CHANGE footer from the body", () => {
    commit("fix: c\n\nBREAKING CHANGE: d")
    assert.equal(computeVersion(repo), "5.0.0")
  })
  test("gives the same version on its own release commit", () => {
    const version = computeVersion(repo)
    commit(`chore(release): ${version} [skip ci]`)
    assert.equal(computeVersion(repo), version)
    rmSync(repo, { recursive: true, force: true })
  })
})
