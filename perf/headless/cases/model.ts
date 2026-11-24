import type { TBenchCase } from "../lib/harness.ts"
import { sized, IMPORT_SIZE, RESIDENT_SIZE, type TBenchFixture } from "../lib/fixture.ts"

/**
 * `IIModel`: the document, and the reads and writes every interaction goes through.
 *
 * `read one symbol by id` rotates over every resident id rather than repeating one. Repeating a
 * single key is neither what the library does nor something the JIT treats stably — its null-test
 * error swung between 1.5% and 29.4% across runs of identical code before the rotation.
 */

const IMPORT_PASSES = 16 // 0.61 ms measured
const APPEND_PASSES = 1000 // 0.27 ms measured
const SYMBOLS_READ_PASSES = 200 // 0.36 ms measured
const GET_ROOT_PASSES = 200 // 1.52 ms measured, one pass reading all 500 ids

export const OBJECT = "model"

export function cases(f: TBenchFixture): TBenchCase[] {
  const { IIModel } = f.iink
  return [
    {
      name: sized(`model: import ${IMPORT_SIZE} strokes`, IMPORT_PASSES),
      fn: () => {
        for (let pass = 0; pass < IMPORT_PASSES; pass++) {
          const fresh = new IIModel()
          for (const stroke of f.importSource) {
            fresh.addSymbol(stroke)
          }
        }
      },
    },
    {
      name: sized(`model: append then remove one stroke @${RESIDENT_SIZE}`, APPEND_PASSES),
      fn: () => {
        for (let pass = 0; pass < APPEND_PASSES; pass++) {
          const stroke = f.appendPool[f.appendCursor]
          f.appendCursor = (f.appendCursor + 1) % f.appendPool.length
          f.model.addSymbol(stroke)
          f.model.removeSymbol(stroke.id)
        }
      },
    },
    {
      name: sized(`model: read symbols @${RESIDENT_SIZE}`, SYMBOLS_READ_PASSES),
      fn: () => {
        let seen = 0
        for (let pass = 0; pass < SYMBOLS_READ_PASSES; pass++) {
          seen += f.model.symbols.length
        }
        if (seen < 0) throw new Error("unreachable")
      },
    },
    {
      name: sized(`model: read one symbol by id @${RESIDENT_SIZE}`, GET_ROOT_PASSES),
      // The lookup's result was discarded through `void`, which let V8 remove part of the work: the
      // case reported 1.6 ns per `Map.get`, below what a real one costs. Counting the hits makes the
      // call observable, the same way the hit test case does.
      fn: () => {
        let found = 0
        for (let pass = 0; pass < GET_ROOT_PASSES; pass++) {
          for (const id of f.allIds) {
            if (f.model.getSymbol(id) !== undefined) found++
          }
        }
        if (found < 0) throw new Error("unreachable")
      },
    },
  ]
}
