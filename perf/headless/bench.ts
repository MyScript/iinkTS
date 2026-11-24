import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { installDom } from "./lib/env.ts"
import { buildFixture, type TIink } from "./lib/fixture.ts"
import { allCases } from "./cases/index.ts"
import { printReport, runSuite, writeReport } from "./lib/harness.ts"

installDom()

/**
 * Which build to measure. Unset means the package's own `#iink`, which is `dist/` — the ordinary
 * case, and what a developer running `yarn bench` expects.
 *
 * `BENCH_LIB` points the same suite at any other bundle. That is what makes a comparison possible
 * without a frozen baseline: build the merge-base alongside the current branch, run this file twice,
 * and the two reports describe two builds measured on one machine instead of one build measured
 * against a record made on another.
 */
const BENCH_LIB = process.env.BENCH_LIB
const bundleLabel = BENCH_LIB ?? "#iink"
const bundleSpecifier = BENCH_LIB === undefined ? "#iink" : pathToFileURL(resolve(process.cwd(), BENCH_LIB)).href

/**
 * What the cases below reach for. Checked at load so a wrong bundle says so, in one line.
 *
 * Constructors and functions only. A configuration constant is not worth a line here: if one were
 * missing, the setup that reads it throws before any measurement, which is the same outcome by a
 * slightly less tidy route.
 */
const REQUIRED_EXPORTS = [
  "CanvasEvent",
  "IIHistoryManager",
  "IIModel",
  "MatrixTransform",
  "SVGRenderer",
  "StrokeUtil",
  "SymbolGeometry",
  "registerBuiltinSymbolUtils",
  "symbolRegistry",
] as const

/**
 * The typed boundary around a module chosen at runtime.
 *
 * `import()` of a non-literal specifier is `any` by construction — the compiler cannot know what a
 * path decided by the environment exports. Rather than let that `any` spread through every case, the
 * exports are checked here and the value is given the one shape the whole file is written against.
 * A bundle that does not have them fails immediately, naming itself, instead of failing later as an
 * undefined call inside a measured window.
 */
async function loadBundle(specifier: string, label: string): Promise<TIink> {
  const loaded = (await import(specifier)) as Record<string, unknown>
  const missing = REQUIRED_EXPORTS.filter((name) => loaded[name] === undefined)
  if (missing.length > 0) {
    throw new Error(
      `the bundle at ${label} is missing ${missing.join(", ")} — is it built, and is it a build of this library?`
    )
  }
  return loaded as unknown as TIink
}

const iink = await loadBundle(bundleSpecifier, bundleLabel)

/**
 * Resident document size. Held at 1200 rather than the 4419 of the reference document because
 * `IIModel.addSymbol` evaluates `this.symbols` as a logger argument on every insertion, and
 * `IIModel.symbols` deep-clones the whole map — so building a document is quadratic in deep clones.
 * That cost is not hidden: it is what the `import` case below measures.
 */

const fixture = buildFixture(iink)

const outFile = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : ".local/bench/current.json"
const repeats = process.argv.includes("--repeats") ? Number(process.argv[process.argv.indexOf("--repeats") + 1]) : 3

/**
 * Narrowing the run to a few objects. Read from the environment as well as the command line because
 * a paired run has to hand the very same filter to both of its child processes.
 */
const onlyArg = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : undefined
const only = (onlyArg ?? process.env.BENCH_ONLY ?? "")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean)

const report = await runSuite(allCases(fixture, only), { repeats })
console.log(`bundle: ${bundleLabel}`)
if (only.length > 0) console.log(`only: ${only.join(", ")}`)
console.log(`dataset: ${fixture.dataset}`)
console.log(`seeding the resident document via addSymbol: ${fixture.seedMs.toFixed(0)} ms`)
printReport(report)
writeReport({ ...report, dataset: fixture.dataset, seedMs: fixture.seedMs, lib: bundleLabel }, outFile)
console.log(`\nreport written to ${outFile}`)
