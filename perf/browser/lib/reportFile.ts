import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { formatTable } from "../../lib/table.ts"
import { abRows, type TScenarioSides } from "./abReport.ts"

/**
 * One project's A/B report on disk. The scenarios write it, the reporter prints it.
 *
 * It is a file and not a value in memory because Playwright restarts the worker after a failed test:
 * whatever the dead worker held is gone, and the scenarios after it would report as if they were the
 * whole run. Each worker merges into the file instead, and `run` tells this run's file from a stale one.
 */
export type TBrowserReport = {
  run: string
  generatedAt: string
  project: string
  documentSize: number
  rounds: number
  referenceSha?: string
  longTasks: boolean
  results: Record<string, TScenarioSides>
  /** Reference runs that crashed the page: their cells are empty, see `measureBoth`. */
  referenceCrashes: string[]
}

export const REPORT_DIR = resolve(process.cwd(), process.env.PERF_E2E_REPORT_DIR || ".local/bench/perf-e2e")

/** Set once by the config in the main process; the workers inherit it. */
export function runId(): string {
  return process.env.PERF_E2E_RUN ?? "local"
}

function reportPath(project: string): string {
  return resolve(REPORT_DIR, `${project.replace(/[^\w.-]+/g, "-")}.json`)
}

function readReport(file: string): TBrowserReport | undefined {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as TBrowserReport
  } catch {
    return undefined
  }
}

/** Writes this worker's scenarios into the project's report, keeping the ones earlier workers wrote. */
export function mergeReport(report: TBrowserReport): void {
  const file = reportPath(report.project)
  const previous = existsSync(file) ? readReport(file) : undefined
  const sameRun = previous?.run === report.run
  const results = sameRun ? { ...previous.results, ...report.results } : report.results
  const referenceCrashes = sameRun
    ? [...new Set([...(previous.referenceCrashes ?? []), ...report.referenceCrashes])]
    : report.referenceCrashes
  mkdirSync(REPORT_DIR, { recursive: true })
  writeFileSync(file, `${JSON.stringify({ ...report, results, referenceCrashes }, null, 2)}\n`)
}

/** Every project's report this run wrote. */
export function readRunReports(run: string): { file: string; report: TBrowserReport }[] {
  if (!existsSync(REPORT_DIR)) return []
  return readdirSync(REPORT_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => resolve(REPORT_DIR, name))
    .map((file) => ({ file, report: readReport(file) }))
    .filter((entry): entry is { file: string; report: TBrowserReport } => entry.report?.run === run)
}

export function formatReport(report: TBrowserReport): string {
  const sha = report.referenceSha ? ` (${report.referenceSha.slice(0, 9)})` : ""
  return [
    `browser perf on ${report.project}, document of ${report.documentSize} strokes, ${report.rounds} paired rounds — reported, not gated`,
    `reference: dist-ref/iink.esm.js${sha}`,
    "current:   dist/iink.esm.js",
    "",
    formatTable(
      ["scenario", "metric", "before", "after", "change", "description"],
      abRows(report.results, report.longTasks),
      ["left", "left", "right", "right", "right"]
    ),
    "",
    `before/after: each build's median over the rounds.${report.longTasks ? "" : " No blocking time: this engine does not report long tasks."}`,
    ...(report.referenceCrashes?.length
      ? [`the reference build crashed the page, its cells are empty: ${report.referenceCrashes.join("; ")}`]
      : []),
  ].join("\n")
}
