/**
 * The perf history: one record per commit, kept so a regression can be read as a trend rather than as
 * a single comparison.
 *
 * Why this exists at all. A single build cannot tell a 6% regression from noise — measured on
 * 2026-09-09, the dispersion a threshold would have to clear is itself unreproducible, varying by a
 * factor of two to five between recordings of the same code on the same quiet machine. Twenty builds
 * can: a sustained shift is visible where a single step is not. The history is also the only way to
 * tune the gate honestly, by replaying past runs and counting how many false positives a candidate
 * rule would have produced.
 *
 * The record is deliberately not the whole run report. It keeps exactly what a later question can be
 * asked of — the ratios, their dispersion, the absolute times, the sample counts and the machine —
 * so the format survives changes to the harness around it.
 */

/** The subset of a run report a history record is built from. Declared here so this module imports nothing. */
export type THistorySource = {
  generatedAt: string
  agent: string
  cpu: string
  nodeVersion: string
  processes?: number
  controlSpread: number
  ratios: Record<string, number>
  ratioMaxDeviation?: Record<string, number>
  cases: { name: string; p50Ms: number; samples: number }[]
}

/**
 * What the run measured, and what it measured it against.
 *
 * Without this a record says how fast a build was and stays silent about the build it was compared
 * with, which is half the story: the figures come from a paired run, and reading one side of a pair
 * without knowing the other is how a number gets quoted out of context months later.
 */
export type TMeasuredAgainst = {
  /** The commit the reference bundle was built from — normally the merge-base. */
  sha?: string
  /** The two bundles, spelled as the run was given them. */
  referenceLib?: string
  currentLib?: string
}

export type THistoryRecord = {
  /** The commit the measured build was made from. One record per commit, overwritten on a re-run. */
  commit: string
  branch: string
  /** Absent when the figures came from a single-sided run, which was compared with nothing. */
  measuredAgainst?: TMeasuredAgainst
  recordedAt: string
  agent: string
  cpu: string
  nodeVersion: string
  processes: number
  controlSpread: number
  /** Median ratio per case — the quantity that survives a change of machine. */
  ratios: Record<string, number>
  /** Widest relative distance from the median any process showed. Recorded, not trusted. */
  ratioMaxDeviation: Record<string, number>
  /** Absolute median latency per case. For reading, and for the measurability floor. */
  p50Ms: Record<string, number>
  /** How many measurements each median came from. A p50 over few draws is a coarse number. */
  samples: Record<string, number>
}

export function toRecord(
  source: THistorySource,
  git: { commit: string; branch: string },
  measuredAgainst?: TMeasuredAgainst
): THistoryRecord {
  const against = measuredAgainst && Object.values(measuredAgainst).some((v) => v !== undefined)
  return {
    commit: git.commit,
    ...(against ? { measuredAgainst } : {}),
    branch: git.branch,
    recordedAt: source.generatedAt,
    agent: source.agent,
    cpu: source.cpu,
    nodeVersion: source.nodeVersion,
    processes: source.processes ?? 1,
    controlSpread: source.controlSpread,
    ratios: { ...source.ratios },
    ratioMaxDeviation: { ...(source.ratioMaxDeviation ?? {}) },
    p50Ms: Object.fromEntries(source.cases.map((c) => [c.name, c.p50Ms])),
    samples: Object.fromEntries(source.cases.map((c) => [c.name, c.samples])),
  }
}

/** One record per commit: a rebuilt commit replaces its record rather than adding a second one. */
export function recordFileName(record: THistoryRecord): string {
  return `${record.commit}.json`
}

/**
 * Oldest first. Sorted on the recorded time rather than on the file name, because a commit hash says
 * nothing about order and a rebuilt commit keeps its place in the sequence by when it was measured.
 *
 * The commit breaks a tie. Two records can share a timestamp — the same report recorded twice under
 * different commits, which is what a replay does — and without a tiebreak their order would come from
 * whatever the directory listing happened to return, so two prunes of the same history could drop
 * different records.
 */
export function sortRecords(records: THistoryRecord[]): THistoryRecord[] {
  return [...records].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.commit.localeCompare(b.commit))
}

/**
 * The ratios one case took across the history, oldest first. Records that never measured the case —
 * because it did not exist yet, or was renamed — are left out rather than reported as a gap.
 */
export function trendFor(records: THistoryRecord[], caseName: string): { commit: string; ratio: number }[] {
  return sortRecords(records)
    .filter((r) => r.ratios[caseName] !== undefined)
    .map((r) => ({ commit: r.commit, ratio: r.ratios[caseName] }))
}

/**
 * The `keep` most recent records, and the names of the ones that fall out.
 *
 * The history is carried forward from build to build — each build starts from the previous build's
 * copy and adds one record — so without a cap it would grow for as long as the project does. Trimming
 * the oldest is the right end to trim: a trend is read backwards from now, and a record old enough to
 * fall out is one whose commit is no longer in anybody's window.
 */
export function pruneRecords(
  records: THistoryRecord[],
  keep: number
): { kept: THistoryRecord[]; dropped: THistoryRecord[] } {
  const sorted = sortRecords(records)
  if (keep <= 0) return { kept: [], dropped: sorted }
  return { kept: sorted.slice(-keep), dropped: sorted.slice(0, Math.max(0, sorted.length - keep)) }
}

/** Every case name the history has ever recorded, so a reader does not have to know them in advance. */
export function caseNames(records: THistoryRecord[]): string[] {
  return [...new Set(records.flatMap((r) => Object.keys(r.ratios)))].sort()
}
