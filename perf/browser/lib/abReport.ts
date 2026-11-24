import { median } from "../../headless/lib/stats.ts"
import type { TScenarioMeasurement } from "./instrument.ts"

/** Every run of one scenario, per build, in the order they were measured. */
export type TScenarioSides = {
  reference: TScenarioMeasurement[]
  current: TScenarioMeasurement[]
}

type TMetric = {
  label: string
  /** What the figure means, printed beside it: the table is read by people who never opened this file. */
  description: string
  pick: (m: TScenarioMeasurement) => number
  /** Long tasks are Chromium-only: on another engine the figure is a constant 0, not a measurement. */
  needsLongTasks?: boolean
}

/**
 * What the table shows per scenario. Blocking time leads because it is what the library does to the
 * main thread; wall time is mostly the websocket round trip, and frame p95 is the stutter a user sees.
 */
const METRICS: TMetric[] = [
  {
    label: "blocking (ms)",
    description: "main thread time spent in tasks over 50 ms: the jank the library causes",
    pick: (m) => m.blockingMs,
    needsLongTasks: true,
  },
  {
    label: "wall (ms)",
    description: "scenario start to end, websocket round trips included",
    pick: (m) => m.wallMs,
  },
  {
    label: "frame p50 (ms)",
    description: "median time between two frames; 16.7 ms is a smooth 60 fps",
    pick: (m) => m.frameP50Ms,
  },
  {
    label: "frame p95 (ms)",
    description: "95% of frames are faster than this: the usual worst stutter",
    pick: (m) => m.frameP95Ms,
  },
  {
    label: "dropped frames",
    description: "frames over 33.4 ms, two 60 Hz frames missed: stutters a user sees",
    pick: (m) => m.droppedFrames,
  },
]

function formatValue(value: number | undefined): string {
  if (value === undefined) return "—"
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/**
 * The change between the two medians. A reference at 0 has no ratio — a scenario that never blocked
 * the main thread before — so it reads "—" rather than an infinite percentage.
 */
export function formatChange(before: number | undefined, after: number | undefined): string {
  if (before === undefined || after === undefined || before === 0) return "—"
  const drift = after / before - 1
  return `${drift >= 0 ? "+" : ""}${(drift * 100).toFixed(1)}%`
}

function medianOf(runs: TScenarioMeasurement[], metric: TMetric): number | undefined {
  return runs.length === 0 ? undefined : median(runs.map(metric.pick))
}

/** One row per scenario and metric: scenario, metric, before, after, change, description. */
export function abRows(results: Record<string, TScenarioSides>, longTasks: boolean): string[][] {
  const metrics = METRICS.filter((metric) => longTasks || !metric.needsLongTasks)
  return Object.entries(results).flatMap(([scenario, sides]) =>
    metrics.map((metric) => {
      const before = medianOf(sides.reference, metric)
      const after = medianOf(sides.current, metric)
      return [
        scenario,
        metric.label,
        formatValue(before),
        formatValue(after),
        formatChange(before, after),
        metric.description,
      ]
    })
  )
}
