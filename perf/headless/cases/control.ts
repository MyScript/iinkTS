import { CONTROL_CASE, type TBenchCase } from "../lib/harness.ts"
import { type TBenchFixture } from "../lib/fixture.ts"

/**
 * The calibration case: plain arithmetic, no library code at all.
 *
 * Not an object of the library and it measures none of it. It is here because its true answer is
 * known — identical builds must read x1.000 — which is what lets a run say how wrong it is.
 */

export const OBJECT = "control"

export function cases(f: TBenchFixture): TBenchCase[] {
  return [
    {
      name: CONTROL_CASE,
      fn: () => {
        let acc = 0
        for (let i = 0; i < f.controlBuffer.length; i++) {
          acc += Math.sqrt(f.controlBuffer[i]) * 1.000001
        }
        if (acc < 0) throw new Error("unreachable")
      },
    },
  ]
}
