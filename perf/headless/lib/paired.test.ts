import { pairedSamples, referenceFirst, unpairedCases, type TPairedRound } from "./paired"

/**
 * The pairing arithmetic. Unit-tested because every verdict the gate gives is one of these numbers,
 * and because the cases it has to refuse — a case only one build has — are exactly the ones a naive
 * implementation reports as an infinite regression.
 */

function round(reference: Record<string, number>, current: Record<string, number>): TPairedRound {
  return { reference, current }
}

describe("pairedSamples", () => {
  test("gives the current build's cost as a multiple of the reference's", () => {
    expect(pairedSamples([round({ case: 2 }, { case: 3 })])).toEqual({ case: [1.5] })
  })

  test("keeps one sample per round, in order", () => {
    const samples = pairedSamples([round({ case: 2 }, { case: 2 }), round({ case: 2 }, { case: 4 })])
    expect(samples.case).toEqual([1, 2])
  })

  test("skips a round where the reference did not measure the case", () => {
    // A case the branch added: there is nothing for it to be a multiple of, and reporting it as one
    // would be inventing a verdict.
    const samples = pairedSamples([round({}, { fresh: 5 }), round({ fresh: 2 }, { fresh: 4 })])
    expect(samples.fresh).toEqual([2])
  })

  test("skips a round whose reference measured zero", () => {
    expect(pairedSamples([round({ case: 0 }, { case: 3 })])).toEqual({})
  })

  test("skips a round whose current measurement is not a number", () => {
    expect(pairedSamples([round({ case: 2 }, { case: Number.NaN })])).toEqual({})
  })

  test("returns nothing for no rounds at all", () => {
    expect(pairedSamples([])).toEqual({})
  })
})

describe("unpairedCases", () => {
  test("reports what only the current build has", () => {
    const rounds = [round({ shared: 1 }, { shared: 1, added: 1 })]
    expect(unpairedCases(rounds)).toEqual({ onlyReference: [], onlyCurrent: ["added"] })
  })

  test("reports what only the reference build has", () => {
    const rounds = [round({ shared: 1, removed: 1 }, { shared: 1 })]
    expect(unpairedCases(rounds)).toEqual({ onlyReference: ["removed"], onlyCurrent: [] })
  })

  test("counts a case as present when any round measured it", () => {
    // A case that threw in one round is still a case both builds have; only a case no round of one
    // side ever produced is unpaired.
    const rounds = [round({ flaky: 1 }, {}), round({ flaky: 1 }, { flaky: 1 })]
    expect(unpairedCases(rounds).onlyReference).toEqual([])
  })

  test("sorts both lists", () => {
    const rounds = [round({}, { b: 1, a: 1 })]
    expect(unpairedCases(rounds).onlyCurrent).toEqual(["a", "b"])
  })
})

describe("referenceFirst", () => {
  test("alternates, so neither build always takes the earlier slot", () => {
    expect([0, 1, 2, 3].map(referenceFirst)).toEqual([true, false, true, false])
  })
})
