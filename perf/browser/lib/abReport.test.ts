import { abRows, formatChange } from "./abReport.ts"
import type { TScenarioMeasurement } from "./instrument.ts"

function run(blockingMs: number, wallMs: number, frameP95Ms: number): TScenarioMeasurement {
  return {
    wallMs,
    blockingMs,
    longTaskCount: 0,
    longestTaskMs: 0,
    frameCount: 0,
    frameP50Ms: 0,
    frameP95Ms,
    frameMaxMs: 0,
    droppedFrames: 0,
  }
}

describe("formatChange", () => {
  test("signs the change of the current build against the reference", () => {
    expect(formatChange(200, 250)).toBe("+25.0%")
    expect(formatChange(200, 150)).toBe("-25.0%")
  })

  test("has no ratio against a reference at zero", () => {
    expect(formatChange(0, 12)).toBe("—")
  })
})

describe("abRows", () => {
  const results = {
    drag: {
      reference: [run(100, 1000, 16.7), run(300, 1200, 16.7), run(200, 1100, 33.4)],
      current: [run(150, 900, 16.7), run(250, 1000, 16.7), run(350, 1100, 16.7)],
    },
  }

  test("compares each build's median, metric by metric", () => {
    expect(abRows(results, true).map((row) => row.slice(0, 5))).toEqual([
      ["drag", "blocking (ms)", "200", "250", "+25.0%"],
      ["drag", "wall (ms)", "1100", "1000", "-9.1%"],
      ["drag", "frame p50 (ms)", "0", "0", "—"],
      ["drag", "frame p95 (ms)", "16.7", "16.7", "+0.0%"],
      ["drag", "dropped frames", "0", "0", "—"],
    ])
  })

  test("explains every metric it reports", () => {
    for (const row of abRows(results, true)) expect(row[5].length).toBeGreaterThan(0)
  })

  test("leaves blocking time out on an engine without long tasks", () => {
    expect(abRows(results, false).map((row) => row[1])).not.toContain("blocking (ms)")
  })

  test("reads a build that produced no run as missing, not as zero", () => {
    expect(abRows({ drag: { reference: [], current: [run(1, 2, 3)] } }, false)[0].slice(0, 5)).toEqual([
      "drag",
      "wall (ms)",
      "—",
      "2",
      "—",
    ])
  })
})
