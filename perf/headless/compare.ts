import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { MIN_GATED_MS, MIN_ROUNDS, evaluate, type TPairedGateReport, type TVerdict } from "./lib/gate.ts"
import { formatTable } from "../lib/table.ts"

/**
 * The regression gate. It compares two builds measured in the same job, minutes apart, and never a
 * build against a record made elsewhere.
 *
 * The decision itself lives in `lib/gate.ts` and is unit-tested. This file reads the report, prints
 * the table, and sets the exit code — nothing that needs a judgement call.
 */

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name)
  return i === -1 ? fallback : process.argv[i + 1]
}

/**
 * The two reasons a case is not gated need different work from whoever reads this: a case under the
 * floor needs more work per iteration before it measures anything, a case that rarely paired needs
 * finding out why one build failed to produce it.
 */
function markFor(v: TVerdict): string {
  if (v.regressed) return "REGRESSED"
  if (!v.gated) return v.ungatedReason === "timer-floor" ? "too small" : "unpaired"
  return v.improved ? "improved" : ""
}

function noteFor(v: TVerdict, rounds: number): string {
  if (v.gated) return `limit ${(v.threshold * 100).toFixed(0)}%`
  if (v.ungatedReason === "timer-floor") return `not gated, under the ${MIN_GATED_MS} ms floor`
  return `not gated, paired in only ${v.rounds} of ${rounds} rounds`
}

const file = arg("--paired", ".local/bench/paired.json")
const report = JSON.parse(readFileSync(resolve(process.cwd(), file), "utf8")) as TPairedGateReport & {
  generatedAt?: string
  agent?: string
  referenceLib?: string
  referenceSha?: string
  currentLib?: string
  current: { cases: { name: string; p50Ms: number }[] }
}

/** Each build's median per case, keyed by name, for the before and after columns. */
function p50ByName(cases: { name: string; p50Ms: number }[]): Map<string, number> {
  return new Map(cases.map((c) => [c.name, c.p50Ms]))
}

function formatMs(ms: number | undefined): string {
  if (ms === undefined) return "—"
  return ms < 10 ? ms.toFixed(3) : ms.toFixed(1)
}

const result = evaluate(report)

console.log(`\n${report.rounds} paired rounds${report.agent ? ` on ${report.agent}` : ""}`)
console.log(
  `reference: ${report.referenceLib ?? "?"}${report.referenceSha ? ` (${report.referenceSha.slice(0, 9)})` : ""}`
)
console.log(`current:   ${report.currentLib ?? "?"}`)

if (result.refusal) {
  console.error(`\n${result.refusal.message}`)
  process.exit(2)
}

// The limit is the run's own, not a constant: most cases measure the same code on both sides, so how
// much they disagree with each other is how wrong this run is, and the limit is drawn from that.
console.log(
  `\nthis run's cases scatter by ${(result.nullScale * 100).toFixed(1)}%, so the limit is ${(result.threshold * 100).toFixed(0)}%`
)
console.log("+0.0% means the two builds cost the same.\n")

const before = p50ByName(report.reference.cases)
const after = p50ByName(report.current.cases)
const rows = result.verdicts.map((v) => [
  v.name,
  formatMs(before.get(v.name)),
  formatMs(after.get(v.name)),
  `${v.drift >= 0 ? "+" : ""}${(v.drift * 100).toFixed(1)}%`,
  markFor(v),
  noteFor(v, report.rounds),
])
console.log(
  formatTable(["case", "before (ms)", "after (ms)", "change", "verdict", "note"], rows, [
    "left",
    "right",
    "right",
    "right",
  ])
)
// The change is the median of the per-round ratios, which is what the gate judges; the two medians
// beside it are each build's own and need not divide to exactly that figure.
console.log("\nbefore/after: each build's median; change: median of the paired rounds, what the gate judges.")

for (const name of result.onlyCurrent) {
  console.log(`\nadded by this branch, nothing to compare it against: ${name}`)
}
for (const name of result.onlyReference) {
  console.log(`\ngone from this branch, no longer measured: ${name}`)
}

if (result.regressions.length > 0) {
  console.error(`\n${result.regressions.length} case(s) regressed past ${(result.threshold * 100).toFixed(0)}%.`)
  process.exit(1)
}
console.log(`\nno case moved past ${(result.threshold * 100).toFixed(0)}% over ${MIN_ROUNDS}+ paired rounds.`)
