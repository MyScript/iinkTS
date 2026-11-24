import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"

import { caseNames, sortRecords, trendFor, type THistoryRecord } from "./lib/history.ts"

/**
 * Prints the recorded history as one line per case, oldest run on the left.
 *
 * This is the half of the history that justifies keeping it: a single build cannot separate a small
 * regression from noise, and a column of twenty can. Ratios are shown relative to the oldest run in
 * the window so a sustained shift reads as a shift rather than as eight unrelated numbers.
 */

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name)
  return i === -1 ? fallback : process.argv[i + 1]
}

const dir = resolve(process.cwd(), arg("--dir", ".local/bench-history"))
const limit = Number(arg("--limit", "20"))

const records: THistoryRecord[] = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(resolve(dir, f), "utf8")) as THistoryRecord)

if (records.length === 0) {
  console.log(`no records in ${dir} — run yarn bench:record after a bench run.`)
  process.exit(0)
}

const window = sortRecords(records).slice(-limit)
console.log(`\n${window.length} run(s), oldest first, each shown relative to the oldest in the window\n`)
console.log(`commits: ${window.map((r) => r.commit.slice(0, 7)).join(" ")}`)
console.log(`agents:  ${[...new Set(window.map((r) => r.agent))].join(", ")}\n`)

const names = caseNames(window)
const width = Math.max(...names.map((n) => n.length))
for (const name of names) {
  const points = trendFor(window, name)
  if (points.length === 0) continue
  const base = points[0].ratio
  const cells = points.map((p) => (base > 0 ? `x${(p.ratio / base).toFixed(2)}` : "  n/a")).join(" ")
  console.log(`${name.padEnd(width)}  ${cells}`)
}
