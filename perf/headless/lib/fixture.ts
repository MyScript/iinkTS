import { countPointers, generateDocument } from "./generateDocument.ts"

/**
 * The document every case measures against, and the objects holding it.
 *
 * Built once per process and handed to the case factories, which is what keeps them from reaching
 * for the library themselves: a case file that imported `#iink` would always measure `dist/`, so
 * both sides of an A/B would run the same code and the case would read x1.000 whatever happened.
 * The bundle arrives here, as a value, and leaves through `iink`.
 */

/** The library, whichever build the run was pointed at. */
export type TIink = typeof import("#iink")
export type TStroke = ReturnType<TIink["StrokeUtil"]["createEmpty"]>

/**
 * Building a stroke, under whichever API the measured bundle exposes.
 *
 * The two sides of an A/B are not the same code, and this is where it shows: the reference is built
 * from the merge-base, so while the epic that folds `StrokeOps` into `StrokeUtil` is in flight the
 * reference exposes the old object and `dist/` the new statics. The fixture is shared by both.
 *
 * Resolved once, at setup, so the tolerance never sits inside a measured window.
 */
type TStrokeApi = {
  createEmpty: (style: undefined, pointerType: string) => TStroke
  addPointer: (stroke: TStroke, pointer: unknown) => void
  createFromPartial: (partial: unknown) => TStroke
}

function resolveStrokeApi(iink: TIink): TStrokeApi {
  const source: unknown = Reflect.get(iink, "StrokeOps") ?? iink.StrokeUtil
  const pick = (...names: string[]): ((...args: never[]) => unknown) => {
    for (const name of names) {
      const candidate: unknown = Reflect.get(source as object, name)
      if (typeof candidate === "function") {
        return (candidate as (...args: never[]) => unknown).bind(source)
      }
    }
    throw new Error(`the measured bundle exposes no stroke ${names.join(" or ")} — nothing to build a document from`)
  }
  return {
    createEmpty: pick("createEmpty", "create") as TStrokeApi["createEmpty"],
    addPointer: pick("addPointer") as TStrokeApi["addPointer"],
    createFromPartial: pick("createFromPartial") as TStrokeApi["createFromPartial"],
  }
}

/**
 * Resident document size. Held at 500 rather than the 4419 of the reference document because
 * `IIModel.addSymbol` used to evaluate `this.symbols` as a logger argument on every insertion.
 */
export const RESIDENT_SIZE = 500

/** Import is measured at a smaller size, for the same reason the resident document is capped. */
export const IMPORT_SIZE = 200

/** Fixed seed. The document must be identical on every machine for the ratios to mean anything. */
export const SEED = 20260827

/**
 * Volume of the reference document used to diagnose the pan-latency bug, reused here so the geometry
 * cache is measured at the size that made the read cost visible in the first place.
 */
export const GEOMETRY_SYMBOL_COUNT = 4419
const GEOMETRY_POINTS_PER_STROKE = 40

/**
 * How many times a case repeats its own unit of work per measured operation.
 *
 * There used to be one shared factor of 20, which is the same mistake as one shared threshold: the
 * cases span seven orders of magnitude, so a single number cannot put them all in a measurable band.
 * At 20 passes one iteration of `getSymbol` cost 0.00003 ms — below the resolution of
 * `performance.now()`, so it timed the clock rather than the code, and then failed CI at +21%
 * against a 15% limit on a tree nobody had touched.
 *
 * A factor is not only about cost. `getSymbol` cleared the floor at 100 000 repeats of a single
 * lookup and still read badly, because repeating one key is a shape the JIT treats unstably and is
 * not what the library does either. Rotating over every resident id fixed both at once.
 *
 * Each factor lives beside its case and is chosen from a measurement, targeting **0.1-10 ms per
 * iteration**. A case whose smallest indivisible unit already costs more than the band keeps a factor
 * of 1 and sits above it.
 *
 * They are constants, not calibrated at runtime, on purpose: the two sides of an A/B comparison must
 * do byte-for-byte the same work, and a factor recomputed per run would not guarantee that.
 */
export function sized(name: string, passes: number): string {
  return passes > 1 ? `${name} x${passes}` : name
}

export type TBenchFixture = {
  iink: TIink
  /** For the record: what was generated, and what seeding it cost. */
  dataset: string
  seedMs: number
  strokes: TStroke[]
  /**
   * The resident document again, frozen — what hit-testing actually reads.
   *
   * Separate copies rather than `strokes` frozen in place: the model, the history and the renderer
   * all hold those same references and expect to be able to write to them.
   *
   * It matters because `SymbolGeometry` caches per symbol and **only for a frozen one** — a draft is
   * recomputed on every read, by design. `SymbolStore` deep-freezes what it commits, so every symbol
   * a selection reads in production is frozen and cached; hit-testing unfrozen strokes would measure
   * a geometry rebuilt on every call, which happens nowhere.
   */
  hitTestStrokes: TStroke[]
  importSource: TStroke[]
  model: InstanceType<TIink["IIModel"]>
  allIds: string[]
  history: InstanceType<TIink["IIHistoryManager"]>
  historyChanges: { added: TStroke[] }[]
  renderer: InstanceType<TIink["SVGRenderer"]>
  appendPool: TStroke[]
  appendCursor: number
  probeBox: { x: number; y: number; width: number; height: number }
  matrix: InstanceType<TIink["MatrixTransform"]>
  controlBuffer: Float64Array
  geometryWarmStrokes: TStroke[]
  buildFrozenGeometryStrokes: () => TStroke[]
}

export function buildFixture(iink: TIink): TBenchFixture {
  const {
    CanvasEvent,
    DefaultHistoryConfiguration,
    DefaultIIRendererConfiguration,
    IIHistoryManager,
    IIModel,
    MatrixTransform,
    SVGRenderer,
    SymbolGeometry,
    registerBuiltinSymbolUtils,
  } = iink

  registerBuiltinSymbolUtils()

  const strokeApi = resolveStrokeApi(iink)

  const buildStroke = (generated: ReturnType<typeof generateDocument>[number]): TStroke => {
    const stroke = strokeApi.createEmpty(undefined, generated.pointerType)
    generated.pointers.forEach((p) => strokeApi.addPointer(stroke, p))
    return stroke
  }

  // The generator's whole contract is that `(count, seed)` fixes the geometry. If it ever stopped
  // holding, every ratio would silently compare two different documents, so it is checked rather
  // than trusted.
  const probe = 32
  if (JSON.stringify(generateDocument(probe, SEED)) !== JSON.stringify(generateDocument(probe, SEED))) {
    throw new Error("generateDocument is not deterministic — every measurement would be meaningless")
  }

  const generated = generateDocument(RESIDENT_SIZE, SEED)
  const strokes = generated.map(buildStroke)

  const hitTestStrokes = strokes.map((stroke) => {
    const copy = structuredClone(stroke)
    Object.freeze(copy.pointers)
    return Object.freeze(copy)
  })

  const seedStart = performance.now()
  const model = new IIModel()
  for (const stroke of strokes) {
    model.addSymbol(stroke)
  }
  const seedMs = performance.now() - seedStart

  const history = new IIHistoryManager(DefaultHistoryConfiguration, new CanvasEvent(document.createElement("div")))
  history.init(model)

  const rendererElement = document.createElement("div")
  document.body.appendChild(rendererElement)
  const renderer = new SVGRenderer(DefaultIIRendererConfiguration)
  renderer.init(rendererElement)
  strokes.forEach((stroke) => renderer.drawSymbol(stroke))

  // `SymbolGeometry` only caches for a frozen symbol — an unfrozen one is recomputed on every call,
  // by design. `Object.freeze` is what makes a "warm" measurement possible at all: without it the
  // warm case would silently take the uncached path and measure the same thing as the cold one.
  const buildFrozenGeometryStrokes = (): TStroke[] =>
    Array.from({ length: GEOMETRY_SYMBOL_COUNT }, (_, i) =>
      Object.freeze(
        strokeApi.createFromPartial({
          pointers: Array.from({ length: GEOMETRY_POINTS_PER_STROKE }, (_, j) => ({
            x: i + j,
            y: i - j,
            dt: j,
            p: 1,
          })),
        })
      )
    )
  const geometryWarmStrokes = buildFrozenGeometryStrokes()
  geometryWarmStrokes.forEach((s) => SymbolGeometry.boundsOf(s))

  // Plain arithmetic over a preallocated buffer, no library code whatsoever. Sized so one iteration
  // lands in the same order of magnitude as the mid-range cases.
  const controlBuffer = new Float64Array(65536)
  for (let i = 0; i < controlBuffer.length; i++) {
    controlBuffer[i] = i * 0.5
  }

  return {
    iink,
    dataset: `${RESIDENT_SIZE} strokes / ${countPointers(generated)} pointers, seed ${SEED}`,
    seedMs,
    strokes,
    hitTestStrokes,
    importSource: generateDocument(IMPORT_SIZE, SEED + 1).map(buildStroke),
    model,
    allIds: strokes.map((stroke) => stroke.id),
    history,
    historyChanges: strokes.map((stroke) => ({ added: [stroke] })),
    renderer,
    // Pre-built strokes for the append case, so generation never lands inside a measured window.
    appendPool: generateDocument(64, SEED + 2).map(buildStroke),
    appendCursor: 0,
    probeBox: { x: 200, y: 100, width: 40, height: 40 },
    matrix: new MatrixTransform(1.02, 0.01, -0.01, 1.02, 3, -2),
    controlBuffer,
    geometryWarmStrokes,
    buildFrozenGeometryStrokes,
  }
}
