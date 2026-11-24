import {
  MAX_NULL_SCALE,
  MAX_USABLE_SPREAD,
  MIN_GATED_MS,
  MIN_ROUNDS,
  MIN_THRESHOLD,
  NULL_FACTOR,
  evaluate,
  type TPairedGateReport,
} from "./gate"

/**
 * The perf gate's decision rule. It is unit-tested because its predecessor twice reported a
 * near-regression on code that had not been touched, and both times the cause was in this arithmetic
 * rather than in the measurement.
 */

const CONTROL = "control: float arithmetic"

function report(over: Partial<TPairedGateReport> = {}): TPairedGateReport {
  const rounds = over.rounds ?? MIN_ROUNDS
  return {
    rounds,
    samples: { [CONTROL]: Array(rounds).fill(1), case: Array(rounds).fill(1) },
    paired: { [CONTROL]: 1, case: 1 },
    onlyReference: [],
    onlyCurrent: [],
    reference: {
      cases: [
        { name: CONTROL, p50Ms: 0.1 },
        { name: "case", p50Ms: 5 },
      ],
      controlSpread: 0.03,
    },
    current: { controlSpread: 0.03 },
    ...over,
  }
}

/** A case whose paired median is `ratio`, paired in every round. */
function withCase(ratio: number, over: Partial<TPairedGateReport> = {}): TPairedGateReport {
  const base = report(over)
  return { ...base, paired: { ...base.paired, case: ratio } }
}

describe("evaluate — regression detection", () => {
  test("passes a build that costs the same as its reference", () => {
    const result = evaluate(report())
    expect(result.regressions).toHaveLength(0)
    expect(result.verdicts.every((v) => v.gated)).toBe(true)
  })

  test("passes a drift below the threshold", () => {
    const result = evaluate(withCase(1 + MIN_THRESHOLD - 0.01))
    expect(result.regressions).toHaveLength(0)
  })

  test("flags a drift above the threshold", () => {
    const result = evaluate(withCase(1 + MIN_THRESHOLD + 0.01))
    expect(result.regressions.map((v) => v.name)).toEqual(["case"])
  })

  test("does not flag a drift a hair under the threshold", () => {
    // Named for what it can check. A drift exactly equal to the threshold is not constructible in
    // floating point — `1 + 0.2` minus 1 is 0.19999999999999996 — so `>` and `>=` cannot be told
    // apart here, and a test claiming to sit on the boundary would be claiming more than it does.
    expect(evaluate(withCase(1 + MIN_THRESHOLD)).regressions).toHaveLength(0)
  })

  test("reports the drift as the distance from parity", () => {
    expect(evaluate(withCase(1.4)).verdicts[0].drift).toBeCloseTo(0.4, 10)
  })

  test("marks a symmetric drop as improved rather than regressed", () => {
    const result = evaluate(withCase(1 - MIN_THRESHOLD - 0.01))
    const verdict = result.verdicts.find((v) => v.name === "case")
    expect(verdict?.improved).toBe(true)
    expect(verdict?.regressed).toBe(false)
  })

  test("sorts verdicts worst drift first", () => {
    // Anchored with cases that agree: three cases disagreeing by 20% is a run the gate refuses
    // outright, so a fixture that scatters cannot exercise the ordering.
    const base = report()
    const names = ["a", "b", "c", "d", "e"]
    const result = evaluate({
      ...base,
      samples: Object.fromEntries(names.map((n) => [n, Array(base.rounds).fill(1)])),
      paired: { a: 1.02, b: 1.05, c: 0.98, d: 1, e: 0.99 },
      reference: { cases: names.map((n) => ({ name: n, p50Ms: 5 })), controlSpread: 0.03 },
    })
    expect(result.verdicts.map((v) => v.name)).toEqual(["b", "a", "d", "e", "c"])
  })
})

describe("evaluate — the limit the run gives itself", () => {
  /** `count` cases whose ratios are `ratios`, all measurable and paired in every round. */
  function population(ratios: number[]): TPairedGateReport {
    const base = report()
    const names = ratios.map((_, i) => `case ${i}`)
    return {
      ...base,
      samples: Object.fromEntries(names.map((n) => [n, Array(base.rounds).fill(1)])),
      paired: Object.fromEntries(names.map((n, i) => [n, ratios[i]])),
      reference: { cases: names.map((n) => ({ name: n, p50Ms: 5 })), controlSpread: 0.03 },
    }
  }

  test("falls back to the floor when the run's cases agree", () => {
    const result = evaluate(population([1, 1.01, 0.99, 1.005]))
    expect(result.threshold).toBe(MIN_THRESHOLD)
  })

  test("widens with the run's own scatter once that clears the floor", () => {
    const result = evaluate(population([1, 1.1, 0.9, 1.1, 0.9]))
    expect(result.nullScale).toBeCloseTo(0.1, 2)
    expect(result.threshold).toBeCloseTo(NULL_FACTOR * result.nullScale, 10)
  })

  test("a change that slows every case equally does not widen the limit", () => {
    // The defect this design exists to avoid. Were the scale measured from 1.000 rather than from the
    // run's own centre, a uniform slowdown would raise it, the limit would follow, and the gate would
    // excuse the one kind of regression it should be surest about.
    const result = evaluate(population([1.3, 1.3, 1.3, 1.3]))
    expect(result.threshold).toBe(MIN_THRESHOLD)
    expect(result.regressions).toHaveLength(4)
  })

  test("one regressed case does not drag the limit up with it", () => {
    const result = evaluate(population([1, 1.01, 0.99, 1.005, 2]))
    expect(result.threshold).toBe(MIN_THRESHOLD)
    expect(result.regressions.map((v) => v.name)).toEqual(["case 4"])
  })

  test("leaves ungated cases out of the scale", () => {
    // A case timed against the clock says nothing about how wrong the run is.
    const base = population([1, 1.01, 0.99, 1.005])
    const withNoise = {
      ...base,
      paired: { ...base.paired, junk: 3 },
      samples: { ...base.samples, junk: Array(base.rounds).fill(1) },
      reference: { ...base.reference, cases: [...base.reference.cases, { name: "junk", p50Ms: MIN_GATED_MS / 10 }] },
    }
    expect(evaluate(withNoise).threshold).toBe(MIN_THRESHOLD)
  })

  test("uses the floor alone when too few cases can be gated", () => {
    const result = evaluate(population([1, 1.4]))
    expect(result.nullScale).toBe(0)
    expect(result.threshold).toBe(MIN_THRESHOLD)
  })

  test("refuses a run whose own cases disagree past the ceiling", () => {
    const scatter = MAX_NULL_SCALE + 0.05
    const result = evaluate(population([1 - scatter, 1 + scatter, 1 - scatter, 1 + scatter]))
    expect(result.refusal?.kind).toBe("cases-disagree")
    expect(result.verdicts).toHaveLength(0)
  })
})

describe("evaluate — cases it refuses to gate", () => {
  test("reports but does not gate a case measured below the timer floor", () => {
    const base = withCase(2)
    const result = evaluate({
      ...base,
      reference: { ...base.reference, cases: [{ name: "case", p50Ms: MIN_GATED_MS / 2 }] },
    })
    const verdict = result.verdicts.find((v) => v.name === "case")
    expect(verdict?.gated).toBe(false)
    expect(verdict?.ungatedReason).toBe("timer-floor")
    expect(result.regressions).toHaveLength(0)
  })

  test("gates a case sitting exactly on the floor", () => {
    const base = withCase(2)
    const result = evaluate({
      ...base,
      reference: { ...base.reference, cases: [{ name: "case", p50Ms: MIN_GATED_MS }] },
    })
    expect(result.regressions.map((v) => v.name)).toEqual(["case"])
  })

  test("reports but does not gate a case that rarely paired", () => {
    // One build failing to produce a case half the time is telling you something, and it is not how
    // fast the case is.
    const base = withCase(2)
    const result = evaluate({ ...base, samples: { ...base.samples, case: [1, 1] } })
    const verdict = result.verdicts.find((v) => v.name === "case")
    expect(verdict?.ungatedReason).toBe("too-few-rounds")
    expect(result.regressions).toHaveLength(0)
  })

  test("gates a case paired in exactly the required share of rounds", () => {
    const base = withCase(2)
    const result = evaluate({ ...base, samples: { ...base.samples, case: Array(6).fill(1) } })
    expect(result.verdicts.find((v) => v.name === "case")?.gated).toBe(true)
  })

  test("blames the timer floor rather than the round count when a case is both", () => {
    const base = withCase(2)
    const result = evaluate({
      ...base,
      samples: { ...base.samples, case: [1] },
      reference: { ...base.reference, cases: [{ name: "case", p50Ms: MIN_GATED_MS / 100 }] },
    })
    expect(result.verdicts.find((v) => v.name === "case")?.ungatedReason).toBe("timer-floor")
  })

  test("reports how many rounds each case actually paired", () => {
    const base = report()
    const result = evaluate({ ...base, samples: { ...base.samples, case: Array(7).fill(1) } })
    expect(result.verdicts.find((v) => v.name === "case")?.rounds).toBe(7)
  })
})

describe("evaluate — runs it refuses outright", () => {
  test("refuses a run narrowed to a few objects", () => {
    const result = evaluate(report({ filter: ["renderer"] }))
    expect(result.refusal?.kind).toBe("narrowed-run")
    expect(result.verdicts).toHaveLength(0)
    expect(result.regressions).toHaveLength(0)
  })

  test("judges a run whose filter is recorded but empty", () => {
    // An absent filter and an empty one mean the same thing: nothing was narrowed.
    expect(evaluate(report({ filter: [] })).refusal).toBeUndefined()
  })

  test("blames the narrowing before anything measured", () => {
    // A narrowed run is disqualified by construction. Reporting it as short or noisy would send
    // someone off to add rounds that cannot help.
    const result = evaluate(report({ filter: ["model"], rounds: 1 }))
    expect(result.refusal?.kind).toBe("narrowed-run")
  })

  test("refuses a run with fewer rounds than the minimum", () => {
    const result = evaluate(report({ rounds: MIN_ROUNDS - 1 }))
    expect(result.refusal?.kind).toBe("too-few-rounds")
    expect(result.verdicts).toHaveLength(0)
    expect(result.regressions).toHaveLength(0)
  })

  test("accepts exactly the minimum", () => {
    expect(evaluate(report({ rounds: MIN_ROUNDS })).refusal).toBeUndefined()
  })

  test("refuses when the reference side's control was too noisy", () => {
    const base = report()
    const result = evaluate({
      ...base,
      reference: { ...base.reference, controlSpread: MAX_USABLE_SPREAD + 0.01 },
    })
    expect(result.refusal?.kind).toBe("control-too-noisy")
  })

  test("refuses when the current side's control was too noisy", () => {
    // Either side being unreadable makes the pair unreadable; the noisy one is not always the one
    // that changed.
    const result = evaluate(report({ current: { controlSpread: MAX_USABLE_SPREAD + 0.01 } }))
    expect(result.refusal?.kind).toBe("control-too-noisy")
  })

  test("checks the round count before the control, so a short run is not mislabelled", () => {
    const result = evaluate(report({ rounds: 1, current: { controlSpread: MAX_USABLE_SPREAD + 0.01 } }))
    expect(result.refusal?.kind).toBe("too-few-rounds")
  })
})

describe("evaluate — case inventory", () => {
  test("passes through the cases only one build has, without gating them", () => {
    const result = evaluate(report({ onlyCurrent: ["fresh"], onlyReference: ["gone"] }))
    expect(result.onlyCurrent).toEqual(["fresh"])
    expect(result.onlyReference).toEqual(["gone"])
    expect(result.verdicts.map((v) => v.name)).not.toContain("fresh")
  })
})
