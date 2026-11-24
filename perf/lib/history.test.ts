import {
  caseNames,
  pruneRecords,
  recordFileName,
  sortRecords,
  toRecord,
  trendFor,
  type THistoryRecord,
  type THistorySource,
} from "./history"

/**
 * The history record. It is unit-tested because it is the only artefact of a bench run that outlives
 * the build: a field dropped or aliased here is not noticed until months of trend data are needed and
 * turn out not to be there.
 */

function source(over: Partial<THistorySource> = {}): THistorySource {
  return {
    generatedAt: "2026-09-09T10:00:00.000Z",
    agent: "jenkins",
    cpu: "some cpu",
    nodeVersion: "v25.2.1",
    processes: 5,
    controlSpread: 0.03,
    ratios: { control: 1, case: 10 },
    ratioMaxDeviation: { control: 0, case: 0.07 },
    cases: [
      { name: "control", p50Ms: 0.1, samples: 1300 },
      { name: "case", p50Ms: 1, samples: 140 },
    ],
    ...over,
  }
}

function record(over: Partial<THistoryRecord> = {}): THistoryRecord {
  return { ...toRecord(source(), { commit: "abc1234", branch: "master" }), ...over }
}

describe("toRecord", () => {
  test("keeps the commit and branch it was given", () => {
    const r = toRecord(source(), { commit: "deadbee", branch: "IIC-2045" })
    expect(r.commit).toBe("deadbee")
    expect(r.branch).toBe("IIC-2045")
  })

  test("flattens the case list into per-case times and sample counts", () => {
    const r = toRecord(source(), { commit: "abc1234", branch: "master" })
    expect(r.p50Ms).toEqual({ control: 0.1, case: 1 })
    expect(r.samples).toEqual({ control: 1300, case: 140 })
  })

  test("records the run's own timestamp, not the moment it was written", () => {
    expect(toRecord(source(), { commit: "a", branch: "b" }).recordedAt).toBe("2026-09-09T10:00:00.000Z")
  })

  test("treats a report with no process count as a single-process run", () => {
    expect(toRecord(source({ processes: undefined }), { commit: "a", branch: "b" }).processes).toBe(1)
  })

  test("tolerates a report that carries no dispersion", () => {
    expect(toRecord(source({ ratioMaxDeviation: undefined }), { commit: "a", branch: "b" }).ratioMaxDeviation).toEqual(
      {}
    )
  })

  test("copies the ratios rather than aliasing them", () => {
    // A record that shares its maps with the report would change under anyone who later touched the
    // report, and the corruption would only surface once the history was read, long after.
    const s = source()
    const r = toRecord(s, { commit: "a", branch: "b" })
    s.ratios.case = 999
    expect(r.ratios.case).toBe(10)
  })
})

describe("toRecord — what the run was measured against", () => {
  test("keeps the reference it was given", () => {
    const r = toRecord(source(), { commit: "abc", branch: "b" }, { sha: "deadbee", referenceLib: "dist-ref/x.js" })
    expect(r.measuredAgainst).toEqual({ sha: "deadbee", referenceLib: "dist-ref/x.js" })
  })

  test("says nothing when there was nothing to compare against", () => {
    // A single-sided run was held against no other build, and a record claiming otherwise would be
    // worse than one that stays quiet.
    expect(toRecord(source(), { commit: "abc", branch: "b" }).measuredAgainst).toBeUndefined()
  })

  test("says nothing when every field of the reference is absent", () => {
    expect(toRecord(source(), { commit: "abc", branch: "b" }, {}).measuredAgainst).toBeUndefined()
  })
})

describe("recordFileName", () => {
  test("names the record after the commit, so a rebuild replaces it", () => {
    expect(recordFileName(record({ commit: "abc1234" }))).toBe("abc1234.json")
  })
})

describe("sortRecords", () => {
  test("orders oldest first on the recorded time", () => {
    const older = record({ commit: "zzz", recordedAt: "2026-09-01T00:00:00.000Z" })
    const newer = record({ commit: "aaa", recordedAt: "2026-09-08T00:00:00.000Z" })
    expect(sortRecords([newer, older]).map((r) => r.commit)).toEqual(["zzz", "aaa"])
  })

  test("breaks a tie on the commit, so the order never depends on the directory listing", () => {
    const a = record({ commit: "aaa", recordedAt: "2026-09-01T00:00:00.000Z" })
    const b = record({ commit: "bbb", recordedAt: "2026-09-01T00:00:00.000Z" })
    expect(sortRecords([b, a]).map((r) => r.commit)).toEqual(["aaa", "bbb"])
    expect(sortRecords([a, b]).map((r) => r.commit)).toEqual(["aaa", "bbb"])
  })

  test("does not mutate the array it was given", () => {
    const input = [
      record({ recordedAt: "2026-09-08T00:00:00.000Z" }),
      record({ recordedAt: "2026-09-01T00:00:00.000Z" }),
    ]
    sortRecords(input)
    expect(input[0].recordedAt).toBe("2026-09-08T00:00:00.000Z")
  })
})

describe("trendFor", () => {
  test("returns one point per run, oldest first", () => {
    const a = record({ commit: "aaa", recordedAt: "2026-09-01T00:00:00.000Z", ratios: { case: 10 } })
    const b = record({ commit: "bbb", recordedAt: "2026-09-02T00:00:00.000Z", ratios: { case: 12 } })
    expect(trendFor([b, a], "case")).toEqual([
      { commit: "aaa", ratio: 10 },
      { commit: "bbb", ratio: 12 },
    ])
  })

  test("skips runs that never measured the case", () => {
    // A case added mid-history, or renamed: a gap is not a zero, and reporting it as one would draw a
    // cliff that never happened.
    const withIt = record({ commit: "aaa", recordedAt: "2026-09-01T00:00:00.000Z", ratios: { case: 10 } })
    const without = record({ commit: "bbb", recordedAt: "2026-09-02T00:00:00.000Z", ratios: { other: 3 } })
    expect(trendFor([withIt, without], "case")).toEqual([{ commit: "aaa", ratio: 10 }])
  })

  test("returns nothing for a case the history never saw", () => {
    expect(trendFor([record()], "never measured")).toEqual([])
  })
})

describe("pruneRecords", () => {
  const at = (day: string, commit: string) => record({ commit, recordedAt: `2026-09-0${day}T00:00:00.000Z` })

  test("keeps the most recent records and drops the oldest", () => {
    const all = [at("3", "ccc"), at("1", "aaa"), at("2", "bbb")]
    const { kept, dropped } = pruneRecords(all, 2)
    expect(kept.map((r) => r.commit)).toEqual(["bbb", "ccc"])
    expect(dropped.map((r) => r.commit)).toEqual(["aaa"])
  })

  test("drops nothing when the history is shorter than the cap", () => {
    const { kept, dropped } = pruneRecords([at("1", "aaa")], 500)
    expect(kept).toHaveLength(1)
    expect(dropped).toHaveLength(0)
  })

  test("drops everything when asked to keep none", () => {
    // Guards the boundary rather than the happy path: slice(-0) returns the whole array, so a naive
    // implementation keeps everything at exactly the value that asks for nothing.
    const { kept, dropped } = pruneRecords([at("1", "aaa"), at("2", "bbb")], 0)
    expect(kept).toEqual([])
    expect(dropped.map((r) => r.commit)).toEqual(["aaa", "bbb"])
  })

  test("prunes on recorded time, not on the order it was handed", () => {
    const { kept } = pruneRecords([at("1", "old"), at("9", "new")], 1)
    expect(kept.map((r) => r.commit)).toEqual(["new"])
  })
})

describe("caseNames", () => {
  test("unions the cases across every run, sorted", () => {
    const a = record({ ratios: { b: 1, a: 2 } })
    const b = record({ ratios: { c: 3, a: 4 } })
    expect(caseNames([a, b])).toEqual(["a", "b", "c"])
  })

  test("returns nothing for an empty history", () => {
    expect(caseNames([])).toEqual([])
  })
})
