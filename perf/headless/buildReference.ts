import { execFileSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

/**
 * Builds the bundle the current branch is measured against, from the commit the branch left the base
 * at.
 *
 * The point is to stop comparing across machines. A committed baseline is a recording of another
 * computer on another day; a reference bundle built here, now, is measured by the same suite on the
 * same agent minutes apart, so whatever the machine is doing lands on both sides.
 *
 * The reference is built in a detached worktree rather than by moving the checkout, so an interrupted
 * run cannot leave the branch somewhere else.
 */

const WORKTREE = resolve(process.cwd(), ".local/bench-ref-worktree")
const OUT = resolve(process.cwd(), "dist-ref/iink.esm.js")
const STAMP = resolve(process.cwd(), "dist-ref/.reference-sha")

function git(args: string[], cwd = process.cwd()): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim()
}

/** An option given on the command line, then in the environment, or nothing. */
function option(flag: string, variable: string): string | undefined {
  const i = process.argv.indexOf(flag)
  if (i !== -1) return process.argv[i + 1]
  // An empty variable is an unset one. CI hands out `FOO=` for a value it did not have, and taking
  // that literally is how a build ends up running `git worktree add ""`.
  return process.env[variable] || undefined
}

/** `git rev-parse` for a ref that may not exist, without turning its absence into a crash. */
function revParse(ref: string): string | undefined {
  try {
    return git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`])
  } catch {
    return undefined
  }
}

/**
 * The base branch, as a commit.
 *
 * A CI checkout is not a clone: Jenkins fetches the refs it was told to and no more, so
 * `origin/master` is routinely absent from a pull-request workspace — which is exactly how this
 * failed on PR-515 with `fatal: Not a valid object name origin/master`.
 *
 * Four routes, cheapest and safest first. The network is last on purpose: the bench runs inside a
 * container that is given no git credentials, since the Jenkinsfile hands those out only inside
 * `withCredentials`, so a fetch here is a hope rather than a plan.
 */
function baseCommit(base: string): string {
  for (const spelling of [`origin/${base}`, `refs/remotes/origin/${base}`, base]) {
    const sha = revParse(spelling)
    if (sha) {
      console.log(`base ${base} found as ${spelling}`)
      return sha
    }
  }

  // A pull-request build usually checks out Jenkins' merge of the branch into its target, and that
  // merge's first parent is the target's tip — the base, already here, no network needed. Guarded on
  // CHANGE_ID so a developer's own merge commit on an ordinary branch build cannot be mistaken for it.
  const mergeParent = process.env.CHANGE_ID ? revParse("HEAD^1") : undefined
  if (mergeParent && revParse("HEAD^2")) {
    console.log(`base ${base} taken from the first parent of this pull request's merge commit`)
    return mergeParent
  }

  try {
    execFileSync("git", ["fetch", "--no-tags", "origin", `+refs/heads/${base}:refs/remotes/origin/${base}`], {
      stdio: "inherit",
    })
  } catch {
    // Reported below with everything else that was tried, rather than as a bare git failure.
  }
  const fetched = revParse(`refs/remotes/origin/${base}`)
  if (fetched) {
    console.log(`base ${base} fetched`)
    return fetched
  }

  const refs = git(["for-each-ref", "--format=%(refname)", "refs/heads", "refs/remotes"]) || "(none)"
  throw new Error(
    `cannot find the base branch "${base}" in this checkout, and fetching it did not work either.\n` +
      "In CI the fix is upstream of here: the Checkout stage adds the target branch to its fetch " +
      "refspec, because this process has no git credentials of its own. If that stage ran and the " +
      "branch is still missing, the refspec is not reaching this workspace.\n" +
      "Otherwise set BENCH_REF_BASE to a ref that is here, or give the reference commit directly " +
      `with BENCH_REF_SHA.\nRefs this checkout does have:\n${refs}`
  )
}

/** A shallow checkout can hold two tips and none of the history that joins them. */
function mergeBaseWith(baseSha: string): string | undefined {
  try {
    return git(["merge-base", baseSha, "HEAD"])
  } catch {
    return undefined
  }
}

/**
 * Where this branch left the base. On the base branch itself the merge-base is HEAD, which would
 * compare a build to itself: the previous commit is used instead, so a build of master measures what
 * its own last commit changed.
 */
function referenceSha(base: string): string {
  const head = git(["rev-parse", "HEAD"])
  const baseSha = baseCommit(base)
  let mergeBase = mergeBaseWith(baseSha)

  if (mergeBase === undefined && revParse("HEAD") && git(["rev-parse", "--is-shallow-repository"]) === "true") {
    console.log("no common ancestor in a shallow checkout — deepening")
    try {
      execFileSync("git", ["fetch", "--no-tags", "--deepen=200", "origin"], { stdio: "inherit" })
    } catch {
      // Same as above: the failure is reported with its context rather than on its own.
    }
    mergeBase = mergeBaseWith(baseSha)
  }

  if (mergeBase === undefined) {
    throw new Error(
      `HEAD and ${base} (${baseSha.slice(0, 9)}) have no common ancestor in this checkout. ` +
        "The branch is here and its history is not: a shallow clone holds the tips without what " +
        "joins them. Deepening needs credentials this process does not have, so the fix is a " +
        "non-shallow CloneOption on the Checkout stage — or give the reference commit directly " +
        "with BENCH_REF_SHA."
    )
  }
  return mergeBase === head ? git(["rev-parse", "HEAD~1"]) : mergeBase
}

/**
 * The reference build needs dependencies. When the lockfile has not moved since the reference commit
 * the ones already installed are by definition the right ones, and hard-linking them costs a fraction
 * of a second against a minute of install. When it has moved, they are not the right ones — a
 * dependency bump is a performance change like any other — so the worktree installs its own.
 */
function prepareDependencies(sha: string): string {
  const lockUnchanged = git(["show", `${sha}:yarn.lock`]) === readFileSync("yarn.lock", "utf8").trim()
  if (lockUnchanged) {
    try {
      execFileSync("cp", ["-al", resolve(process.cwd(), "node_modules"), resolve(WORKTREE, "node_modules")])
      return "hard-linked from the current install"
    } catch {
      // Hard links need one filesystem and a cp that supports them. Falling back is cheaper to write
      // than to detect.
    }
  }
  execFileSync("yarn", ["install", "--immutable"], { cwd: WORKTREE, stdio: "inherit" })
  return lockUnchanged ? "installed (hard links unavailable)" : "installed (the lockfile moved)"
}

// A branch name, not a ref: which spelling of it exists is the checkout's business, not the caller's.
// `CHANGE_TARGET` is what Jenkins calls the branch a pull request is aimed at.
const base = option("--base", "BENCH_REF_BASE") ?? process.env.CHANGE_TARGET ?? "master"
// Resolved only when it has to be. `--sha` and `BENCH_REF_SHA` are the way out of a checkout whose
// base branch cannot be found, so they must not be reached through a call that needs it.
const sha = option("--sha", "BENCH_REF_SHA") ?? referenceSha(base)

if (existsSync(OUT) && existsSync(STAMP) && readFileSync(STAMP, "utf8").trim() === sha) {
  console.log(`reference bundle for ${sha.slice(0, 9)} is already built at ${OUT}`)
  process.exit(0)
}

rmSync(WORKTREE, { recursive: true, force: true })
execFileSync("git", ["worktree", "prune"], { stdio: "ignore" })
console.log(`building the reference bundle from ${sha.slice(0, 9)} (base ${base})`)

try {
  execFileSync("git", ["worktree", "add", "--detach", WORKTREE, sha], { stdio: "inherit" })
  console.log(`dependencies: ${prepareDependencies(sha)}`)
  execFileSync("yarn", ["build:lib"], { cwd: WORKTREE, stdio: "inherit" })

  mkdirSync(dirname(OUT), { recursive: true })
  cpSync(resolve(WORKTREE, "dist/iink.esm.js"), OUT)
  writeFileSync(STAMP, `${sha}\n`)
  console.log(`\nreference bundle written to ${OUT}`)
} finally {
  rmSync(WORKTREE, { recursive: true, force: true })
  execFileSync("git", ["worktree", "prune"], { stdio: "ignore" })
}
