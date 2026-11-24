import type { Page } from "@playwright/test"

/**
 * Browser-side timing signals for one scenario.
 *
 * The primary figure is `blockingMs`, not the wall clock: every interactive-ink operation crosses a
 * websocket, so wall time is mostly network and says little about the library. Long tasks measure
 * what the library does to the main thread, which is what a user feels as jank, and they are
 * network-independent.
 */
export type TScenarioMeasurement = {
  wallMs: number
  /** Total time the main thread spent in tasks longer than 50 ms. */
  blockingMs: number
  longTaskCount: number
  longestTaskMs: number
  /** Frame intervals sampled with requestAnimationFrame while the scenario ran. */
  frameCount: number
  frameP50Ms: number
  frameP95Ms: number
  frameMaxMs: number
  /** Frames that took longer than two 60 Hz frames — the visible stutters. */
  droppedFrames: number
}

type TRawSamples = { longTasks: number[]; frames: number[] }

/**
 * Installed before any page script runs, so no long task is missed during load. `PerformanceObserver`
 * with `longtask` is Chromium-only: elsewhere the observer is not started, blocking time stays at 0,
 * and the report leaves it out — see `longTasksSupported`.
 */
export async function installProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state: { longTasks: number[]; frames: number[]; observer?: PerformanceObserver; raf: number } = {
      longTasks: [],
      frames: [],
      raf: 0,
    }
    const sample = () => {
      state.frames.push(performance.now())
      state.raf = requestAnimationFrame(sample)
    }
    Object.assign(window, {
      __perf: {
        start() {
          state.longTasks = []
          state.frames = []
          state.observer?.disconnect()
          state.observer = undefined
          if (PerformanceObserver.supportedEntryTypes?.includes("longtask")) {
            state.observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                state.longTasks.push(entry.duration)
              }
            })
            state.observer.observe({ entryTypes: ["longtask"] })
          }
          cancelAnimationFrame(state.raf)
          state.raf = requestAnimationFrame(sample)
        },
        stop() {
          state.observer?.disconnect()
          cancelAnimationFrame(state.raf)
          return { longTasks: [...state.longTasks], frames: [...state.frames] }
        },
      },
    })
  })
}

/** Whether this browser reports long tasks at all, so a 0 ms blocking time means something. */
export async function longTasksSupported(page: Page): Promise<boolean> {
  return await page.evaluate(() => PerformanceObserver.supportedEntryTypes?.includes("longtask") ?? false)
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]
}

/** Runs `action` with the probe recording, and reduces the raw samples to the reported figures. */
export async function measure(page: Page, action: () => Promise<void>): Promise<TScenarioMeasurement> {
  await page.evaluate(() => (window as unknown as { __perf: { start(): void } }).__perf.start())
  const started = Date.now()
  await action()
  const wallMs = Date.now() - started
  const raw = (await page.evaluate(() =>
    (window as unknown as { __perf: { stop(): TRawSamples } }).__perf.stop()
  )) as TRawSamples

  const intervals: number[] = []
  for (let i = 1; i < raw.frames.length; i++) {
    intervals.push(raw.frames[i] - raw.frames[i - 1])
  }

  return {
    wallMs,
    blockingMs: Math.round(raw.longTasks.reduce((total, d) => total + d, 0)),
    longTaskCount: raw.longTasks.length,
    longestTaskMs: Math.round(Math.max(0, ...raw.longTasks)),
    frameCount: intervals.length,
    frameP50Ms: Number(percentile(intervals, 50).toFixed(1)),
    frameP95Ms: Number(percentile(intervals, 95).toFixed(1)),
    frameMaxMs: Number(Math.max(0, ...intervals).toFixed(1)),
    droppedFrames: intervals.filter((d) => d > 33.4).length,
  }
}
