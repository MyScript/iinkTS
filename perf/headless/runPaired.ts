import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

import { DEFAULT_ROUNDS, runPaired } from "./lib/multiProcess.ts"

/**
 * Measures both builds here, alternating, and writes what the gate judges.
 *
 * This replaces the shape the gate used to be given — one run of one build, held against a baseline
 * recorded elsewhere. The reference bundle comes from `yarn bench:ref`, which builds it from the
 * commit the branch left the base at.
 */

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name)
  return i === -1 ? fallback : process.argv[i + 1]
}

const rounds = Number(process.env.BENCH_ROUNDS ?? arg("--rounds", String(DEFAULT_ROUNDS)))
const referenceLib = arg("--reference", "dist-ref/iink.esm.js")
const currentLib = arg("--current-lib", "dist/iink.esm.js")
const out = arg("--out", ".local/bench/paired.json")
const only = arg("--only", "")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean)

for (const [what, path] of [
  ["reference", referenceLib],
  ["current", currentLib],
] as const) {
  if (!existsSync(resolve(process.cwd(), path))) {
    console.error(
      `no ${what} bundle at ${path} — run ${what === "reference" ? "yarn bench:ref" : "yarn build:lib"} first.`
    )
    process.exit(2)
  }
}

const shaFile = resolve(process.cwd(), dirname(referenceLib), ".reference-sha")
const referenceSha = existsSync(shaFile) ? readFileSync(shaFile, "utf8").trim() : undefined

const report = runPaired({ rounds, referenceLib, currentLib, only, ...(referenceSha ? { referenceSha } : {}) })

console.log(`\n${report.rounds} paired rounds on ${report.agent} | ${report.cpu}`)
console.log(`reference: ${report.referenceLib}${referenceSha ? ` (${referenceSha.slice(0, 9)})` : ""}`)
console.log(`current:   ${report.currentLib}`)
if (report.filter) console.log(`only:      ${report.filter.join(", ")} — the gate will refuse a narrowed run`)
console.log("")

const names = Object.keys(report.paired).sort()
const width = Math.max(...names.map((n) => n.length))
for (const name of names) {
  const samples = report.samples[name] ?? []
  const spread =
    samples.length > 1 ? `${(Math.min(...samples) * 100).toFixed(0)}-${(Math.max(...samples) * 100).toFixed(0)}%` : "—"
  console.log(`${name.padEnd(width)}  x${report.paired[name].toFixed(3)}  (rounds ${spread})`)
}
for (const name of report.onlyCurrent) console.log(`only in the current build, unpaired: ${name}`)
for (const name of report.onlyReference) console.log(`only in the reference build, unpaired: ${name}`)

const file = resolve(process.cwd(), out)
mkdirSync(dirname(file), { recursive: true })
writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`)
console.log(`\nreport written to ${file}`)
