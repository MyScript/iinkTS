import type { TBenchCase } from "../lib/harness.ts"
import { sized, RESIDENT_SIZE, type TBenchFixture } from "../lib/fixture.ts"

/** `src/core`: the matrix applied to every pointer of the document. */

const TRANSFORM_PASSES = 20 // 2.81 ms measured

export const OBJECT = "core"

export function cases(f: TBenchFixture): TBenchCase[] {
  const { MatrixTransform } = f.iink
  return [
    {
      name: sized(`core: matrix over every pointer @${RESIDENT_SIZE}`, TRANSFORM_PASSES),
      fn: () => {
        for (let pass = 0; pass < TRANSFORM_PASSES; pass++) {
          for (const stroke of f.strokes) {
            for (const pointer of stroke.pointers) {
              void MatrixTransform.applyToPoint(f.matrix, pointer)
            }
          }
        }
      },
    },
  ]
}
