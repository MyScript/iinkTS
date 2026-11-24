#!/usr/bin/env node
/**
 * Prints the version the current commit should carry, computed from git alone:
 * the latest stable tag reachable from HEAD, bumped by the commits since it.
 *
 * - `!` after the type or a `BREAKING CHANGE:` footer: major
 * - `feat`: minor
 * - anything else: patch
 *
 * The `[ai] ` prefix that marks a commit written by an AI agent is dropped before the type is read.
 *
 * `package.json#version` is never read: CI writes the result there, so starting from it would add
 * a patch on every build. `Pull request #…` merges and `chore(release)` commits carry no change of
 * their own and are skipped, which is what makes a run on the release commit give the same version.
 */
import { execFileSync } from "child_process"
import process from "process"
import { fileURLToPath } from "url"

const STABLE_TAG = /^v?(\d+)\.(\d+)\.(\d+)$/
const BREAKING_SUBJECT = /^\w+(\([^)]*\))?!:/
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:/m
const FEAT_SUBJECT = /^feat(\([^)]*\))?:/
const SKIPPED_SUBJECT = /^(Pull request #|chore\(release\))/
const AI_PREFIX = /^\[ai\] /

const LEVELS = ["patch", "minor", "major"]

/**
 * @param {string} tag
 * @returns {[number, number, number] | undefined}
 */
export function parseStableTag(tag) {
  const match = STABLE_TAG.exec(tag.trim())
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined
}

/**
 * @param {string[]} tags
 * @returns {string | undefined} the highest stable tag, pre-releases and other names ignored
 */
export function latestStableTag(tags) {
  let best
  let bestParts
  for (const tag of tags) {
    const parts = parseStableTag(tag)
    if (!parts) continue
    if (!bestParts || compareParts(parts, bestParts) > 0) {
      best = tag.trim()
      bestParts = parts
    }
  }
  return best
}

/**
 * @param {[number, number, number]} a
 * @param {[number, number, number]} b
 */
function compareParts(a, b) {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]
}

/**
 * @param {string} message a full commit message, subject then body
 * @returns {"major" | "minor" | "patch" | undefined} undefined for a commit that does not count
 */
export function bumpLevel(message) {
  const subject = message.trimStart().split("\n", 1)[0].replace(AI_PREFIX, "")
  if (!subject || SKIPPED_SUBJECT.test(subject)) return undefined
  if (BREAKING_SUBJECT.test(subject) || BREAKING_FOOTER.test(message)) return "major"
  if (FEAT_SUBJECT.test(subject)) return "minor"
  return "patch"
}

/**
 * @param {string} tag the latest stable tag
 * @param {string[]} messages the commit messages since that tag
 * @returns {string} the version, without `v`
 */
export function nextVersion(tag, messages) {
  const parts = parseStableTag(tag)
  if (!parts) throw new Error(`"${tag}" is not a stable tag`)
  const [major, minor, patch] = parts
  const level = messages.map(bumpLevel).reduce((highest, current) => {
    return LEVELS.indexOf(current) > LEVELS.indexOf(highest) ? current : highest
  }, undefined)
  switch (level) {
    case "major":
      return `${major + 1}.0.0`
    case "minor":
      return `${major}.${minor + 1}.0`
    case "patch":
      return `${major}.${minor}.${patch + 1}`
    default:
      return `${major}.${minor}.${patch}`
  }
}

/**
 * @param {string} cwd the git working tree
 * @returns {string}
 */
export function computeVersion(cwd = process.cwd()) {
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf-8" })
  const tag = latestStableTag(git("tag", "--merged", "HEAD").split("\n"))
  if (!tag) throw new Error("No stable tag reachable from HEAD: fetch the tags first")
  const messages = git("log", "--format=%B%x00", `${tag}..HEAD`)
    .split("\0")
    .filter((m) => m.trim())
  return nextVersion(tag, messages)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${computeVersion()}\n`)
}
