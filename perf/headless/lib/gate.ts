/**
 * The gate's decision, as a pure function of one paired run.
 *
 * It used to compare a run against `baseline.json`, a recording of another machine on another day.
 * That was abandoned for a measured reason: the dispersion such a baseline reports is not
 * reproducible — recorded three times from unchanged code on one quiet machine, every case's tail
 * moved by a factor of two to five — so every threshold derived from it was a lottery. What the gate
 * reads now is the ratio of two builds measured here, alternating, which has no baseline to go stale
 * and no second machine to disagree with.
 *
 * It is a separate module from `compare.ts` for one reason: the rule below is what failed on
 * unchanged code more than once, so it needs unit tests, and a top-level script that reads files and
 * calls `process.exit` cannot have any.
 *
 * Deliberately free of imports, including type-only ones. Not a style choice: the harness runs under
 * node's type stripping, which needs `.ts` in a specifier, and the jest config that runs the unit test
 * emits, so it cannot enable `allowImportingTsExtensions`. One of the two would break. That is why the
 * median absolute deviation below is spelled out here instead of coming from `stats.ts` — it is six
 * lines and it does not move; if it ever needs to, change both. `TPairedReport` from
 * `../lib/multiProcess.ts` structurally satisfies `TPairedGateReport`.
 */

/** The subset of a paired report the decision actually reads. The gate declares its own input. */
export type TPairedGateReport = {
  /** How many times each build was measured. */
  rounds: number
  /** The current build's cost as a multiple of the reference's, per case, one entry per round. */
  samples: Record<string, number[]>
  /** The median of those samples: the number a verdict is given on. */
  paired: Record<string, number>
  /** Cases only one build has. Facts about the branch, never a verdict. */
  onlyReference: string[]
  onlyCurrent: string[]
  reference: { cases: { name: string; p50Ms: number }[]; controlSpread: number }
  current: { controlSpread: number }
  /** Set when the run was narrowed to a few objects. Such a run is read, never judged. */
  filter?: string[]
}

/**
 * Floor under the threshold, whatever the run says about itself.
 *
 * A suspiciously quiet pair of runs must not be allowed to make the gate hair-trigger, because the
 * next run on the same agent will not be as quiet. The figure comes from measurement: across four
 * null runs — both bundles byte-identical, so every case had to read exactly 1.000 — the worst error
 * the method made was 10.3%. 20% leaves roughly a factor of two over that.
 */
export const MIN_THRESHOLD = 0.2

/**
 * How many times the run's own scatter a case must exceed to be called a regression.
 *
 * Five rather than two or three because the scale below is a median absolute deviation, which is
 * blind to the tail by construction: it describes where the middle of the scatter is, not how far it
 * reaches. A bound has to clear the reach.
 */
export const NULL_FACTOR = 5

/**
 * Above this the run's own cases disagreed with each other too much for any verdict.
 *
 * Measured null runs sit between 1.2% and 3.0%. At 10% the threshold this rule would produce is 50%,
 * which is not a gate; saying so is better than issuing a limit nothing could ever cross.
 */
export const MAX_NULL_SCALE = 0.1

/** Below this many gated cases the scatter of the population means nothing, and only the floor applies. */
export const MIN_NULL_CASES = 3

/**
 * Below this median latency a case is not measured, it is timed against the clock's own cost.
 *
 * `performance.now()` costs tens of nanoseconds to call and tinybench times every iteration
 * individually, so at a few microseconds an iteration the timer is a visible share of the number.
 * Read from the reference side, which is the side that did not change.
 */
export const MIN_GATED_MS = 0.05

/**
 * The run must pair both builds at least this many times.
 *
 * Not a round number picked for comfort: against byte-identical bundles the median paired ratio was
 * still 42.8% away from 1.000 at five rounds and within 5.5% at eight. Five is what the old
 * single-sided run used, and it is not enough here.
 */
export const MIN_ROUNDS = 8

/**
 * A case must have been paired in at least this share of the rounds. A case that only produced a
 * measurement half the time is telling you something, and it is not how fast it is.
 */
export const MIN_PAIRED_FRACTION = 0.75

/**
 * Above this the whole run is refused rather than believed. A gate that cannot tell a regression from
 * noise has to say so, not guess.
 */
export const MAX_USABLE_SPREAD = 0.35

export type TVerdict = {
  name: string
  /** Median of the paired ratios: the current build's cost as a multiple of the reference's. */
  ratio: number
  /** `ratio - 1`. Positive is slower. */
  drift: number
  /** How many rounds actually paired for this case. */
  rounds: number
  threshold: number
  /** False when the measurement makes a verdict meaningless; it is reported, not gated. */
  gated: boolean
  ungatedReason?: "timer-floor" | "too-few-rounds"
  regressed: boolean
  improved: boolean
}

export type TRefusal = {
  kind: "narrowed-run" | "too-few-rounds" | "control-too-noisy" | "cases-disagree"
  message: string
}

export type TGateResult = {
  /** Set when no verdict can honestly be given. Verdicts are empty in that case. */
  refusal?: TRefusal
  verdicts: TVerdict[]
  /** Cases one build has and the other does not. Reported, never gated. */
  onlyReference: string[]
  onlyCurrent: string[]
  regressions: TVerdict[]
  /** How much this run's own gated cases scattered, and the limit that came out of it. */
  nullScale: number
  threshold: number
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function refuse(kind: TRefusal["kind"], message: string): TGateResult {
  return {
    refusal: { kind, message },
    verdicts: [],
    onlyReference: [],
    onlyCurrent: [],
    regressions: [],
    nullScale: 0,
    threshold: MIN_THRESHOLD,
  }
}

/**
 * Why this case cannot be judged, or nothing. Split out because the run's own limit is derived from
 * the cases that *can* be, so gatability has to be known before any verdict is given.
 */
function ungatedReasonFor(report: TPairedGateReport, name: string): TVerdict["ungatedReason"] {
  // The floor is checked first: a case timed against the clock cannot be rescued by pairing it more
  // often, and calling it under-sampled would send someone off to add rounds that cannot help.
  if (belowTimerFloor(report, name)) return "timer-floor"
  if ((report.samples[name]?.length ?? 0) < report.rounds * MIN_PAIRED_FRACTION) return "too-few-rounds"
  return undefined
}

/**
 * How wrong this run is about itself.
 *
 * A branch changes the cost of a case or two; the rest of the suite measures the same code on both
 * sides and must read 1.000. Their disagreement is therefore the method's own error, measured on this
 * agent, in this job — no recording of another machine required, and nothing to keep up to date.
 *
 * It is the scatter **around the run's own centre**, not the distance from 1.000, and that is the
 * whole design. Were it measured from 1.000, a change that slowed every case equally would push the
 * scale up with it, the limit would widen to match, and the gate would quietly excuse the one kind of
 * regression it should be surest about. Measured around the centre, a uniform shift leaves the
 * scatter at zero, the limit falls to its floor, and every case is flagged.
 */
function nullScaleOf(ratios: number[]): number {
  if (ratios.length < MIN_NULL_CASES) return 0
  const centre = medianOf(ratios)
  if (centre <= 0) return 0
  return medianOf(ratios.map((r) => Math.abs(r - centre))) / centre
}

/** See the note at the top of the file for why this is not `median` from `stats.ts`. */
function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/** A baseline that predates per-case milliseconds has no opinion on measurability. Absent means no opinion. */
function belowTimerFloor(report: TPairedGateReport, name: string): boolean {
  const p50Ms = report.reference.cases.find((c) => c.name === name)?.p50Ms
  return p50Ms !== undefined && p50Ms < MIN_GATED_MS
}

function verdictFor(report: TPairedGateReport, name: string, ratio: number, threshold: number): TVerdict {
  const ungatedReason = ungatedReasonFor(report, name)
  const gated = ungatedReason === undefined
  const drift = ratio - 1
  return {
    name,
    ratio,
    drift,
    rounds: report.samples[name]?.length ?? 0,
    threshold,
    gated,
    ...(ungatedReason ? { ungatedReason } : {}),
    regressed: gated && drift > threshold,
    improved: gated && drift < -threshold,
  }
}

export function evaluate(report: TPairedGateReport): TGateResult {
  // First, because it disqualifies the run by construction rather than by how well it measured.
  // Narrowing is for working on one object's performance, where the numbers are read by the person
  // who asked for them; the limit here is drawn from how much the run's own cases disagree, and a
  // handful of cases cannot say. Refusing is the honest answer, not a verdict on a thin population.
  if (report.filter?.length) {
    return refuse(
      "narrowed-run",
      `this run measured only ${report.filter.join(", ")}. The limit comes from how much the run's ` +
        "own cases disagree with each other, which a narrowed run has too few of to establish. Read " +
        "the numbers; there is no verdict to give."
    )
  }

  if (report.rounds < MIN_ROUNDS) {
    return refuse(
      "too-few-rounds",
      `the run paired the two builds ${report.rounds} time(s); the gate needs at least ${MIN_ROUNDS}. ` +
        "Against byte-identical builds the median paired ratio was still 42.8% out at five rounds and " +
        "within 5.5% at eight. Not reporting a verdict."
    )
  }

  const spread = Math.max(report.reference.controlSpread, report.current.controlSpread)
  if (spread > MAX_USABLE_SPREAD) {
    return refuse(
      "control-too-noisy",
      `control spread is ${pct(spread)}, above the ${pct(MAX_USABLE_SPREAD)} ceiling. The machine is ` +
        "too noisy for this run to mean anything — rerun, or raise the round count. Not reporting a verdict."
    )
  }

  const gatable = Object.entries(report.paired)
    .filter(([name]) => ungatedReasonFor(report, name) === undefined)
    .map(([, ratio]) => ratio)
  const nullScale = nullScaleOf(gatable)

  if (nullScale > MAX_NULL_SCALE) {
    return refuse(
      "cases-disagree",
      `this run's own cases scattered by ${pct(nullScale)}, above the ${pct(MAX_NULL_SCALE)} ceiling. ` +
        "Most of them measure the same code on both sides and should agree; that they do not means " +
        "the run measured the machine rather than the builds. Not reporting a verdict."
    )
  }

  const threshold = Math.max(MIN_THRESHOLD, NULL_FACTOR * nullScale)
  const verdicts = Object.entries(report.paired)
    .map(([name, ratio]) => verdictFor(report, name, ratio, threshold))
    .sort((a, b) => b.drift - a.drift)

  return {
    verdicts,
    onlyReference: [...report.onlyReference],
    onlyCurrent: [...report.onlyCurrent],
    regressions: verdicts.filter((v) => v.regressed),
    nullScale,
    threshold,
  }
}
