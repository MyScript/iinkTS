import * as control from "./control.ts"
import * as core from "./core.ts"
import * as history from "./history.ts"
import * as model from "./model.ts"
import * as renderer from "./renderer.ts"
import * as symbol from "./symbol.ts"
import type { TBenchFixture } from "../lib/fixture.ts"
import type { TBenchCase } from "../lib/harness.ts"

/**
 * Every group of cases, one per object of the library, mirroring `src/`.
 *
 * They are composed into **one** suite producing **one** report, and that is not a detail of taste.
 * The gate draws its limit from how much the run's own cases disagree with each other, and needs at
 * least three of them to say anything: split into a report per object, three of the six would fall
 * under that and run on the floor alone, with the scatter estimated from one or two numbers — the
 * small-sample trap this whole harness exists to avoid.
 *
 * `control` leads because it measures no library code: it is the run's calibration, not an object.
 */
const GROUPS = [control, model, symbol, core, history, renderer]

/** The object names, in the order their cases are measured. */
export const OBJECTS: string[] = GROUPS.map((group) => group.OBJECT)

/**
 * The cases to measure, optionally narrowed to a few objects.
 *
 * `control` survives every filter. It is not an object of the library but the run's calibration, and
 * every ratio in a report is a case divided by it — narrowing it away leaves the suite unable to
 * produce a report at all, which is how this was found.
 *
 * An unknown name throws rather than quietly measuring nothing: a typo in `--only` would otherwise
 * produce an empty, cheerful run.
 */
export function allCases(fixture: TBenchFixture, only?: readonly string[]): TBenchCase[] {
  if (!only?.length) return GROUPS.flatMap((group) => group.cases(fixture))

  const unknown = only.filter((name) => !OBJECTS.includes(name))
  if (unknown.length > 0) {
    throw new Error(`no such object to measure: ${unknown.join(", ")}. Known: ${OBJECTS.join(", ")}`)
  }
  return GROUPS.filter((group) => group === control || only.includes(group.OBJECT)).flatMap((group) =>
    group.cases(fixture)
  )
}
