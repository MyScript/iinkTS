/**
 * Pairing two runs of the same suite over two builds.
 *
 * The arithmetic is trivial and the reason for it is not, so it is worth stating. Comparing a branch
 * against a recording made on another machine on another day means comparing two builds *and* two
 * machines, and the machine wins: measured on 2026-09-09, a committed baseline's own dispersion
 * varied by a factor of two to five between recordings of unchanged code. Measuring both builds here,
 * alternating, removes the machine from the question — what is left is the ratio of one build to the
 * other, round by round.
 *
 * Pairing is done on absolute times, deliberately, and not on each side's ratio to its control case.
 * Dividing both sides by their own control would leave `(cur/ref) * (refControl/curControl)`, which
 * adds the control's noise to every case instead of cancelling anything. With both builds measured in
 * the same conditions there is nothing left for a control to normalise — which frees the control case
 * to do something more useful, being a case whose true answer is known to be 1.
 *
 * Deliberately free of imports so the unit test needs no `.ts`-extension resolution: `median` stays
 * the caller's business, applied to the samples returned here.
 */

/** One round: the same suite measured over each build, back to back. */
export type TPairedRound = {
  /** Median latency per case for the reference build. */
  reference: Record<string, number>
  /** Median latency per case for the build under test. */
  current: Record<string, number>
}

/**
 * The current build's cost as a multiple of the reference's, per case, one entry per round.
 *
 * A round that did not measure a case on both sides contributes nothing to it rather than a zero or a
 * gap: a case added by the branch has no reference to be a multiple of, and saying so by absence is
 * how the caller comes to report it as unpaired rather than as infinitely slower.
 */
export function pairedSamples(rounds: TPairedRound[]): Record<string, number[]> {
  const samples: Record<string, number[]> = {}
  for (const round of rounds) {
    for (const [name, current] of Object.entries(round.current)) {
      const reference = round.reference[name]
      if (reference === undefined || reference <= 0 || !Number.isFinite(current)) continue
      samples[name] = [...(samples[name] ?? []), current / reference]
    }
  }
  return samples
}

/**
 * Cases only one build has. Either is a fact about the branch rather than about its speed — a case it
 * added, or one it removed — and neither can be given a verdict, so both are reported and skipped.
 */
export function unpairedCases(rounds: TPairedRound[]): { onlyReference: string[]; onlyCurrent: string[] } {
  const reference = new Set(rounds.flatMap((r) => Object.keys(r.reference)))
  const current = new Set(rounds.flatMap((r) => Object.keys(r.current)))
  return {
    onlyReference: [...reference].filter((n) => !current.has(n)).sort(),
    onlyCurrent: [...current].filter((n) => !reference.has(n)).sort(),
  }
}

/**
 * Which build a round measures first, alternating in ABBA order.
 *
 * Plain alternation would give one build the earlier slot in every round, so any drift over the run —
 * an agent warming up, a neighbouring job starting — would land on it as a systematic bias rather
 * than as noise. Swapping every other round cancels that to first order.
 */
export function referenceFirst(round: number): boolean {
  return round % 2 === 0
}
