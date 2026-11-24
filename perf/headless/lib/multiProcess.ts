import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { TRunReport } from "./harness.ts"
import { pairedSamples, referenceFirst, unpairedCases, type TPairedRound } from "./paired.ts"
import { maxRelativeDeviation, median, relativeMad } from "./stats.ts"

/**
 * Runs the bench in several **independent processes** and aggregates them.
 *
 * Why processes and not repeats: repeats inside one process share JIT state, heap layout and GC
 * history, so their dispersion is correlated and far narrower than the real run-to-run variance —
 * measured on 2026-08-27, where the import case drifted 15.5% between two unchanged runs while its
 * in-process spread claimed 2.5%.
 *
 * Both the baseline and the run the gate judges go through here, with the same statistic, so the two
 * sides of a comparison are the same kind of number. They differ only in how many processes they can
 * afford: the baseline is recorded once and deliberately, a CI run is paid on every build.
 */
/** `process.env`'s own shape, spelled out: the `NodeJS` namespace is a type-only global the linter does not see. */
type TEnv = Record<string, string | undefined>

function runOneProcess(file: string, env: TEnv): TRunReport {
  execFileSync(process.execPath, ["perf/headless/bench.ts", "--out", file, "--repeats", "1"], {
    stdio: ["ignore", "ignore", "inherit"],
    env,
  })
  return JSON.parse(readFileSync(file, "utf8")) as TRunReport
}

export function runAcrossProcesses(runs: number): TRunReport {
  const dir = mkdtempSync(join(tmpdir(), "iink-bench-"))
  const reports: TRunReport[] = []

  try {
    for (let i = 0; i < runs; i++) {
      process.stdout.write(`bench process ${i + 1}/${runs}\n`)
      reports.push(runOneProcess(join(dir, `run-${i}.json`), process.env))
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }

  return aggregate(reports)
}

/**
 * Both builds, measured here, alternating.
 *
 * How many rounds is not a free choice. Measured on 2026-09-09 against a reference bundle byte-
 * identical to the build under test — so the true answer was 1.00 for every case — the median of the
 * paired ratios was still 42.8% out at five rounds and within 5.5% at eight, for six of the eight
 * cases. Five is the process count the single-sided run used and it is not enough here.
 */
export const DEFAULT_ROUNDS = 8

export type TPairedReport = {
  generatedAt: string
  host: string
  cpu: string
  nodeVersion: string
  agent: string
  rounds: number
  /** The two bundles measured. Both explicit, so neither side is loaded by a different mechanism. */
  referenceLib: string
  currentLib: string
  /**
   * The objects the run was narrowed to, when it was. Recorded because the gate refuses to judge a
   * narrowed run: its limit comes from how much the run's own cases disagree, and a handful of them
   * cannot say.
   */
  filter?: string[]
  /** The commit the reference bundle was built from. */
  referenceSha?: string
  /** The current build's cost as a multiple of the reference's, per case, one entry per round. */
  samples: Record<string, number[]>
  /** The median of those samples: the number a verdict is given on. */
  paired: Record<string, number>
  /** Cases only one build has. Facts about the branch, not about its speed. */
  onlyReference: string[]
  onlyCurrent: string[]
  /** Both sides in full, for the absolute times, the sample counts and the record. */
  reference: TRunReport
  current: TRunReport
}

function p50Map(report: TRunReport): Record<string, number> {
  return Object.fromEntries(report.cases.map((c) => [c.name, c.p50Ms]))
}

function runRounds(
  rounds: number,
  dir: string,
  referenceLib: string,
  currentLib: string,
  only: string[]
): { reference: TRunReport[]; current: TRunReport[] } {
  // Both sides are pointed at an explicit bundle, and neither is left to the package's own `#iink`.
  // The two specifiers resolve the same file but not by the same mechanism, and an asymmetry in the
  // instrument is a defect whether or not a case has yet been found that shows it.
  // One filter value, built once and given to both sides: the two must measure the same set or the
  // pairing compares different suites.
  const shared: TEnv = { ...process.env, ...(only.length > 0 ? { BENCH_ONLY: only.join(",") } : {}) }
  const referenceEnv: TEnv = { ...shared, BENCH_LIB: referenceLib }
  const currentEnv: TEnv = { ...shared, BENCH_LIB: currentLib }

  const reference: TRunReport[] = []
  const current: TRunReport[] = []
  for (let round = 0; round < rounds; round++) {
    process.stdout.write(`round ${round + 1}/${rounds}\n`)
    const measureReference = () => reference.push(runOneProcess(join(dir, `ref-${round}.json`), referenceEnv))
    const measureCurrent = () => current.push(runOneProcess(join(dir, `cur-${round}.json`), currentEnv))
    if (referenceFirst(round)) {
      measureReference()
      measureCurrent()
    } else {
      measureCurrent()
      measureReference()
    }
  }
  return { reference, current }
}

export function runPaired(options: {
  rounds: number
  referenceLib: string
  currentLib: string
  referenceSha?: string
  only?: string[]
}): TPairedReport {
  const dir = mkdtempSync(join(tmpdir(), "iink-bench-ab-"))
  let sides: { reference: TRunReport[]; current: TRunReport[] }
  try {
    sides = runRounds(options.rounds, dir, options.referenceLib, options.currentLib, options.only ?? [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }

  const paired: TPairedRound[] = sides.reference.map((reference, i) => ({
    reference: p50Map(reference),
    current: p50Map(sides.current[i]),
  }))
  const samples = pairedSamples(paired)
  const last = sides.current[sides.current.length - 1]

  return {
    generatedAt: new Date().toISOString(),
    host: last.host,
    cpu: last.cpu,
    nodeVersion: last.nodeVersion,
    agent: last.agent,
    rounds: options.rounds,
    referenceLib: options.referenceLib,
    currentLib: options.currentLib,
    ...(options.referenceSha ? { referenceSha: options.referenceSha } : {}),
    ...(options.only?.length ? { filter: [...options.only] } : {}),
    samples,
    paired: Object.fromEntries(Object.entries(samples).map(([name, values]) => [name, median(values)])),
    ...unpairedCases(paired),
    reference: aggregate(sides.reference),
    current: aggregate(sides.current),
  }
}

/**
 * Keeps the median ratio per case, and both dispersions: the MAD to print, the tail to gate on. The
 * raw per-process ratios are kept too — without them the choice of statistic could never be revisited
 * or audited from a committed baseline, which is how the first threshold rule went unchallenged.
 */
export function aggregate(reports: TRunReport[]): TRunReport {
  const last = reports[reports.length - 1]
  const names = last.cases.map((c) => c.name)

  const ratios: Record<string, number> = {}
  const ratioSpread: Record<string, number> = {}
  const ratioMaxDeviation: Record<string, number> = {}
  const ratioSamples: Record<string, number[]> = {}

  const cases = names.map((name) => {
    const perRun = reports
      .map((r) => ({ ratio: r.ratios[name], ms: r.cases.find((c) => c.name === name)?.p50Ms }))
      .filter((v): v is { ratio: number; ms: number } => v.ratio !== undefined && v.ms !== undefined)
    const sampled = perRun.map((v) => v.ratio)
    ratios[name] = median(sampled)
    ratioSpread[name] = relativeMad(sampled)
    ratioMaxDeviation[name] = maxRelativeDeviation(sampled)
    ratioSamples[name] = sampled.map((v) => Number(v.toFixed(4)))
    return { name, p50Ms: median(perRun.map((v) => v.ms)), samples: perRun.length }
  })

  return {
    ...last,
    generatedAt: new Date().toISOString(),
    processes: reports.length,
    repeats: reports.length,
    cases,
    ratios,
    ratioSpread,
    ratioMaxDeviation,
    ratioSamples,
    controlSpread: relativeMad(reports.map((r) => r.cases.find((c) => c.name === r.controlCase)?.p50Ms ?? 0)),
  }
}

export function printAggregate(report: TRunReport, label: string): void {
  const names = report.cases.map((c) => c.name)
  const width = Math.max(...names.map((n) => n.length))
  console.log(`\n${label} | agent: ${report.agent} | cpu: ${report.cpu}\n`)
  for (const name of names) {
    const mad = report.ratioSpread[name] ?? 0
    const tail = report.ratioMaxDeviation?.[name] ?? 0
    console.log(
      `${name.padEnd(width)}  x${report.ratios[name].toFixed(2)} of control  MAD +/-${(mad * 100).toFixed(1)}%  tail +/-${(tail * 100).toFixed(1)}%`
    )
  }
}
