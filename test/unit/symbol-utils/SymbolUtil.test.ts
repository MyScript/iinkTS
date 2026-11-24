import { BoxOps, MatrixTransform, Geometry2d, Polygon2d, SymbolUtil, TBaseSymbol, TBox, TPartialDeep, TPoint } from "@/iink"

/** The raw (pre-matrix) box every test double instance answers `computeGeometry` with below. */
const RAW_BOX: TBox = { x: 0, y: 0, width: 10, height: 10 }

class TestSymbolUtil extends SymbolUtil<TBaseSymbol> {
  readonly type = "test"
  create(params: TPartialDeep<TBaseSymbol>): TBaseSymbol {
    return {
      id: params.id ?? "test-id",
      creationTime: params.creationTime ?? 0,
      modificationDate: params.modificationDate ?? 0,
      type: "test",
      style: params.style ?? {},
      transform: { ...MatrixTransform.identity(), ...params.transform },
    }
  }
  getGeometry(): Geometry2d {
    return new Polygon2d(BoxOps.getCorners(RAW_BOX))
  }
  overlaps(): boolean {
    return false
  }
  translate(): void {
    // this double exists to exercise the contract's defaults, not to move anything
  }

  rotate(): void {
    // likewise
  }

  resize(): void {
    // likewise
  }
  getSVGElement(symbol: TBaseSymbol): SVGGraphicsElement {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
    group.setAttribute("id", symbol.id)
    return group
  }


  /** Exposes the protected `mapPointsForward` to the tests below, unchanged. */
  testMapPointsForward(symbol: TBaseSymbol, points: TPoint[]): TPoint[] {
    return this.mapPointsForward(symbol, points)
  }
}

describe("SymbolUtil.ts", () => {
  const util = new TestSymbolUtil()
  const symbol: TBaseSymbol = {
    id: "1",
    creationTime: 0,
    modificationDate: 0,
    type: "test",
    style: {},
    transform: MatrixTransform.identity(),
  }

  test("should default getSnapPoints to an empty array", () => {
    expect(util.getSnapPoints(symbol)).toEqual([])
  })

  test("should default canSelect to true", () => {
    expect(util.canSelect(symbol)).toBe(true)
  })

  test("should default canTransform to true", () => {
    expect(util.canTransform(symbol)).toBe(true)
  })

  test("should default canResize to true", () => {
    expect(util.canResize(symbol)).toBe(true)
  })

  test("should default canRotate to true", () => {
    expect(util.canRotate(symbol)).toBe(true)
  })

  test("should require getSVGElement rather than defaulting it", () => {
    // It was optional until IIC-2006, which let a util register successfully and then draw nothing.
    // There is no default to assert any more; what matters is that the member is there and used.
    expect(util.getSVGElement(symbol).getAttribute("id")).toBe("1")
  })
})

/**
 * `overlapsQuery` is what every concrete `overlaps` override (Stroke/Shape/Edge/Text/Math/Decorator)
 * now delegates to instead of testing the query box directly — these cases pin its behaviour once,
 * on the test double, rather than once per type.
 */
// The `overlapsQuery` suite that stood here is gone with the method. It covered mapping a query
// backwards through a symbol's inverse matrix, guarding a non-invertible one, and approximating a
// sheared query with a quad — none of which exists now that a `Geometry2d` can move itself forwards
// instead. Its subjects live on as `Geometry2d.transform` and each shape's own `overlapsBox`.
describe("SymbolUtil.ts mapPointsForward", () => {
  const util = new TestSymbolUtil()

  test("an identity transform returns the same points unchanged", () => {
    const symbol = util.create({})
    const points: TPoint[] = [{ x: 1, y: 2 }]

    expect(util.testMapPointsForward(symbol, points)).toBe(points)
  })

  test("a rotate composed with a translate carries each point through both, in order", () => {
    // Rotate 90° about the origin sends (x, y) to (-y, x); then translate(10, 0) adds (10, 0).
    const symbol = util.create({ transform: { xx: 0, yx: 1, xy: -1, yy: 0, tx: 10, ty: 0 } })

    expect(util.testMapPointsForward(symbol, [{ x: 1, y: 0 }, { x: 0, y: 1 }])).toEqual([
      { x: 10, y: 1 },
      { x: 9, y: 0 },
    ])
  })
})
