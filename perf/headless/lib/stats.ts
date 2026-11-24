/**
 * The statistics the bench and the gate share. They lived in duplicate in `harness.ts` and
 * `runBaseline.ts`, which is how the two ended up reporting dispersions that looked alike and meant
 * different things.
 *
 * Two measures of dispersion are exported on purpose, because they answer different questions:
 *
 * - `relativeMad` describes where the *centre* of the dispersion is. It is deliberately blind to
 *   outliers, which makes it the right thing to print in a report and the wrong thing to build a
 *   tolerance on.
 * - `maxRelativeDeviation` describes the *tail*. A gate's threshold is a bound on the worst thing
 *   that happens on unchanged code, so it is the tail the threshold has to come from.
 *
 * That distinction is not academic: on the 2026-08-27 baseline the `transform` case had the smallest
 * MAD of the whole suite (2.2%) and still drifted 13.9% between two unchanged runs. A threshold taken
 * from its MAD called that a near-regression; a threshold taken from its tail would not have.
 */

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Relative median absolute deviation. Used rather than `(max - min) / median` for *reporting* because
 * a range grows with the number of samples, so a longer run would report a wider figure for the same
 * machine.
 */
export function relativeMad(values: number[]): number {
  if (values.length < 2) return 0
  const centre = median(values)
  if (centre <= 0) return 0
  return median(values.map((v) => Math.abs(v - centre))) / centre
}

/**
 * Largest relative distance from the median that any sample showed. Unlike the MAD this *does* grow
 * as samples are added — which is correct for a tolerance: seeing more of the distribution should
 * widen a bound that is supposed to contain it, not narrow it.
 */
export function maxRelativeDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const centre = median(values)
  if (centre <= 0) return 0
  return Math.max(...values.map((v) => Math.abs(v - centre))) / centre
}
