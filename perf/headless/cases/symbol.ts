import type { TBenchCase } from "../lib/harness.ts"
import { sized, RESIDENT_SIZE, GEOMETRY_SYMBOL_COUNT, type TBenchFixture, type TStroke } from "../lib/fixture.ts"

/** Symbols: hit testing through the registry, and the geometry read cold, warm, and on its own. */

const HIT_TEST_PASSES = 20 // 7.84 ms measured
const GEOMETRY_COLD_PASSES = 1 // 110 ms measured: above the band, one build of the set is its smallest unit
const GEOMETRY_WARM_PASSES = 1 // 0.22 ms measured, one read of the whole set
/**
 * How many of the pooled strokes one iteration builds geometry for.
 *
 * Not the whole 4419 the two cases above use, and the difference is measured rather than chosen for
 * symmetry. At the full set one iteration costs 15.25 ms — above the 0.1-10 ms band — so tinybench
 * stops at its 20-sample floor, and a p50 over 20 draws of a right-skewed latency distribution is
 * coarse. Over 24 paired rounds of byte-identical bundles that read x0.984 with a **37.8% tail**,
 * worse than the gate's own 20% floor: an instrument that cannot see the regression it exists to
 * catch.
 *
 * A smaller slice fixes both halves at once — more samples inside the time budget, and less garbage
 * per iteration, which matters for a case whose whole subject is allocation. At 1000 it costs
 * 3.20 ms and the same 24 paired rounds read x0.984 with a **16.4% tail**, under the floor.
 *
 * Read that gain against the control, not raw: the machine was quieter on the second run (the
 * control's own tail went 22.7% to 12.9%), so the honest figure is this case's tail *relative to the
 * control's*, 1.67x before and 1.27x after. Real, and smaller than the raw numbers suggest.
 */
const GEOMETRY_BUILD_COUNT = 1000

export const OBJECT = "symbol"

/**
 * A util's geometry method, under whichever name the build being measured spells it.
 *
 * The two sides of an A/B are not the same code, and this is the one place that matters: the
 * reference is built from the merge-base with the base branch, so for the length of the epic that
 * renames `computeGeometry` to `getGeometry` the reference exposes the old name while `dist/` exposes
 * the new one. The same case file runs against both. `tinybench` is configured with `throws: true`,
 * so a case that reached for a name one side does not have would not degrade — it would take down
 * that whole round, on the one instrument the epic's go/no-go decision rests on.
 *
 * Resolved once, outside the measured window, so the tolerance costs nothing per iteration.
 */
/**
 * What both representations of a geometry have in common, and all this case needs of either.
 *
 * Structural on purpose: the record a `computeGeometry` util returns and the object a `getGeometry`
 * util returns share these three, and naming them is what lets the case force the same work out of
 * both — see the case for why forcing is the whole point.
 */
type TBuiltGeometry = {
  bounds: unknown
  edges: unknown
  length: number
}

type TComputeGeometry = (symbol: TStroke) => TBuiltGeometry

const GEOMETRY_METHOD_NAMES = ["getGeometry", "computeGeometry"] as const

function resolveComputeGeometry(util: object): TComputeGeometry {
  for (const name of GEOMETRY_METHOD_NAMES) {
    const candidate: unknown = Reflect.get(util, name)
    if (typeof candidate === "function") {
      return (candidate as TComputeGeometry).bind(util)
    }
  }
  throw new Error(
    `no geometry method on the symbol util — looked for ${GEOMETRY_METHOD_NAMES.join(" and ")}. ` +
      "The measured build exposes neither, so this case cannot say anything about it."
  )
}

export function cases(f: TBenchFixture): TBenchCase[] {
  const { SymbolGeometry, symbolRegistry } = f.iink
  const computeGeometry = resolveComputeGeometry(symbolRegistry.getUtilFor(f.geometryWarmStrokes[0]))
  // Sliced once, here, so the measured window holds nothing but the geometry calls.
  const geometryBuildStrokes = f.geometryWarmStrokes.slice(0, GEOMETRY_BUILD_COUNT)
  return [
    {
      name: sized(`symbol: hit test over all @${RESIDENT_SIZE}`, HIT_TEST_PASSES),
      fn: () => {
        let hits = 0
        for (let pass = 0; pass < HIT_TEST_PASSES; pass++) {
          // Frozen, so the geometry cache applies — see `hitTestStrokes`.
          for (const stroke of f.hitTestStrokes) {
            if (symbolRegistry.getUtil(stroke.type)?.overlaps(stroke, f.probeBox)) {
              hits++
            }
          }
        }
        if (hits < 0) throw new Error("unreachable")
      },
    },
    {
      name: sized(`symbol: geometry cold @${GEOMETRY_SYMBOL_COUNT}`, GEOMETRY_COLD_PASSES),
      // A fresh, freshly-frozen stroke set every invocation: every read is a first read, so this is the
      // uncached path — building the f.strokes and computing their geometry, with nothing to reuse.
      fn: () => {
        f.buildFrozenGeometryStrokes().forEach((s) => SymbolGeometry.boundsOf(s))
      },
    },
    {
      name: sized(`symbol: geometry warm @${GEOMETRY_SYMBOL_COUNT}`, GEOMETRY_WARM_PASSES),
      // Same frozen f.strokes on every invocation, already warmed once above: this is a WeakMap hit per
      // symbol, drawing and hit-testing's actual read shape, not the per-frame f.renderer path — the
      // f.renderer's own pan virtualization reads `tracked.bounds`, not `SymbolGeometry`.
      fn: () => {
        f.geometryWarmStrokes.forEach((s) => SymbolGeometry.boundsOf(s))
      },
    },
    {
      name: `symbol: geometry build @${GEOMETRY_BUILD_COUNT}`,
      // Computing and allocating the geometry object, and nothing else.
      //
      // `geometry cold` above cannot answer that question: it builds 4419 strokes of 40 pointers
      // through `createFromPartial` and freezes each one before reading any geometry, so what the
      // geometry itself costs sits underneath the construction of the document it is computed from.
      // Measured on 2026-09-11 over the same 4419 strokes: 120.63 ms for `geometry cold` against
      // 15.25 ms for the geometry alone — **87% of `geometry cold` is stroke construction**. A change
      // that made the geometry 20% dearer would surface there as +2.6%, well under the gate's own 20%
      // floor (`MIN_THRESHOLD`), so the suite would pass and say nothing. That blind spot is this
      // case's whole reason to exist.
      //
      // `geometry cold` is not wrong and is not replaced: it answers "what does importing a document
      // cost", which is a real question with a real answer. This one answers "what does one more
      // allocation per symbol cost" — the question when the geometry stops being an object literal
      // and becomes a class instance.
      //
      // Reaching for the util directly rather than through `SymbolGeometry` is what makes this
      // repeatable: the facade caches on symbol identity, so a second read of the same symbol is a
      // `WeakMap` hit and measures the cache instead. The util's own method holds no cache and
      // recomputes every call, so the same pre-built strokes can be measured over and over — which
      // is the only way to keep construction out of the window, since a case runs at least
      // `MIN_ITERATIONS` times and pre-building a fresh set per iteration is what we are removing.
      //
      // The strokes come from `geometryWarmStrokes`: already warmed in the facade's cache, which
      // this path never consults, so the cases share one pool instead of allocating a second.
      //
      // **The derived values are read, and that is not incidental.** A record-returning util computes
      // bounds, vertices, edges and length before it returns; an object-returning one computes each
      // on first read and may compute none at all. Calling the method and dropping the result would
      // therefore compare building a geometry against allocating an empty one — measured at 3.20 ms
      // against 0.03 ms, a hundredfold "win" that is only work not done yet. Reading them here puts
      // both representations on the same footing, and matches what the library actually pays:
      // `SymbolGeometry` forces exactly these on the cached path, to freeze them.
      //
      // The total is also kept and checked, where the two cases above drop their result on the floor.
      // They can afford to: `boundsOf` writes to a `WeakMap`, an observable effect no optimiser may
      // remove. This path is pure, which is precisely the shape escape analysis is allowed to delete
      // outright, and a case measuring a deleted allocation would read as a fast one.
      fn: () => {
        let total = 0
        for (const stroke of geometryBuildStrokes) {
          const geometry = computeGeometry(stroke)
          if (geometry.bounds !== undefined && geometry.edges !== undefined) {
            total += geometry.length
          }
        }
        if (!Number.isFinite(total)) {
          throw new Error(`geometry length came out ${total} over ${GEOMETRY_BUILD_COUNT} symbols`)
        }
      },
    },
  ]
}
