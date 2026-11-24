import type { TPartialDeep } from "../std"
import type { TPoint } from "./Point"
/**
 * @group Core/Geometry
 * @remarks Represents a 2D affine transform, defined as a 3x3 matrix with an implicit third raw of <code>[ 0 0 1 ]</code>
 */
export type TMatrixTransform = {
  /**
   * @remarks scaling x
   */
  xx: number
  /**
   * @remarks shearing x
   */
  yx: number
  /**
   * @remarks translation x
   */
  tx: number
  /**
   * @remarks shearing y
   */
  xy: number
  /**
   * @remarks scaling y
   */
  yy: number
  /**
   * @remarks translation y
   */
  ty: number
}

/**
 * @group Core/Geometry
 * @remarks Represents a 2D affine transform, defined as a 3x3 matrix with an implicit third raw of <code>[ 0 0 1 ]</code>
 */
/**
 * How close a sine or cosine has to be to 0, 1 or -1 before it is treated as exactly that.
 *
 * Sized for the error `Math.cos`/`Math.sin` leave at the quarter turns — 6.1e-17 for `cos(PI/2)` —
 * with room to spare, and far below any angle a user can express: a full turn split into a million
 * steps still moves a cosine by more than 6e-6.
 */
const UNIT_SNAP_EPSILON = 1e-9

function snapToUnit(value: number): number {
  if (Math.abs(value) < UNIT_SNAP_EPSILON) {
    return 0
  }
  if (Math.abs(value - 1) < UNIT_SNAP_EPSILON) {
    return 1
  }
  if (Math.abs(value + 1) < UNIT_SNAP_EPSILON) {
    return -1
  }
  return value
}

/**
 * @group Core/Geometry
 */
export class MatrixTransform implements TMatrixTransform {
  xx: number
  yx: number
  xy: number
  yy: number
  tx: number
  ty: number

  constructor(xx: number, yx: number, xy: number, yy: number, tx: number, ty: number) {
    this.xx = xx
    this.yx = yx
    this.xy = xy
    this.yy = yy
    this.tx = tx
    this.ty = ty
  }

  static identity(): MatrixTransform {
    return new MatrixTransform(1, 0, 0, 1, 0, 0)
  }

  static applyToPoint(mat: TMatrixTransform, point: TPoint): TPoint {
    return {
      x: mat.xx * point.x + mat.xy * point.y + mat.tx,
      y: mat.yx * point.x + mat.yy * point.y + mat.ty,
    }
  }

  static rotation(mat: TMatrixTransform): number {
    let rotation

    if (mat.xx !== 0 || mat.xy !== 0) {
      const hypotAc = Math.hypot(mat.xx, mat.xy)
      rotation = Math.acos(mat.xx / hypotAc) * (mat.xy > 0 ? -1 : 1)
    } else if (mat.yx !== 0 || mat.yy !== 0) {
      const hypotBd = Math.hypot(mat.yx, mat.yy)
      rotation = Math.PI / 2 + Math.acos(mat.yx / hypotBd) * (mat.yy > 0 ? -1 : 1)
    } else {
      rotation = 0
    }

    return rotation
  }

  static toCssString(matrix: TMatrixTransform): string {
    return `matrix(${matrix.xx}, ${matrix.yx}, ${matrix.xy}, ${matrix.yy}, ${matrix.tx}, ${matrix.ty})`
  }

  invert() {
    const { xx, yx, xy, yy, tx, ty } = this
    const denom = xx * yy - yx * xy
    this.xx = yy / denom
    this.yx = yx / -denom
    this.xy = xy / -denom
    this.yy = xx / denom
    this.tx = (yy * tx - xy * ty) / -denom
    this.ty = (yx * tx - xx * ty) / denom
    return this
  }

  multiply(m: TMatrixTransform): MatrixTransform {
    const { xx, yx, xy, yy, tx, ty } = this
    this.xx = xx * m.xx + xy * m.yx
    this.yx = yx * m.xx + yy * m.yx
    this.xy = xx * m.xy + xy * m.yy
    this.yy = yx * m.xy + yy * m.yy
    this.tx = xx * m.tx + xy * m.ty + tx
    this.ty = yx * m.tx + yy * m.ty + ty
    return this
  }

  translate(tx: number, ty: number): MatrixTransform {
    return this.multiply({
      xx: 1,
      yx: 0,
      xy: 0,
      yy: 1,
      tx,
      ty,
    })
  }

  rotate(radian: number, center?: TPoint): MatrixTransform {
    if (center) {
      this.translate(center.x, center.y)
    }
    // Snapped to the exact value when it is within a whisker of one, not rounded to three decimals.
    // Snapping exists because `Math.cos(Math.PI / 2)` is 6.1e-17 rather than 0, which would otherwise
    // leak into every matrix built from a right angle and into the `matrix(...)` strings the renderer
    // emits. Rounding, which is what this did before, costs orthonormality: cos(37°) and sin(37°)
    // round to 0.799 and 0.602, whose squares sum to 1.000805 — so composing a rotation with its own
    // inverse left a 0.08% scale behind, and an undo/redo cycle compounded it. Now that a transform
    // is a matrix the symbol keeps rather than a pass over its coordinates, that residue would
    // accumulate on the symbol itself instead of being flattened away by the next redraw.
    const cosAngle = snapToUnit(Math.cos(radian))
    const sinAngle = snapToUnit(Math.sin(radian))
    this.multiply({
      xx: cosAngle,
      yx: sinAngle,
      xy: -sinAngle,
      yy: cosAngle,
      tx: 0,
      ty: 0,
    })
    if (center) {
      this.translate(-center.x, -center.y)
    }
    return this
  }

  scale(x: number, y: number, center?: TPoint): MatrixTransform {
    if (center) {
      this.translate(center.x, center.y)
    }
    this.multiply({
      xx: x,
      yx: 0,
      xy: 0,
      yy: y,
      tx: 0,
      ty: 0,
    })
    if (center) {
      this.translate(-center.x, -center.y)
    }
    return this
  }

  applyToPoint(point: TPoint): TPoint {
    return MatrixTransform.applyToPoint(this, point)
  }

  clone(): MatrixTransform {
    return new MatrixTransform(this.xx, this.yx, this.xy, this.yy, this.tx, this.ty)
  }

  toCssString(): string {
    return MatrixTransform.toCssString(this)
  }
}

/**
 * Decimals a transformed coordinate keeps.
 *
 * Three is what this library stores everywhere else — `toFixed(3)` appears in dozens of places. The
 * transform managers were the exception, and only in some of their branches, which is how a resized
 * line came to hold three decimals while a translated one held seventeen.
 */
const TRANSFORM_DECIMALS = 3

function roundCoordinate(value: number): number {
  return +value.toFixed(TRANSFORM_DECIMALS)
}

/**
 * A matrix applied to a point, rounded to the precision the document stores.
 *
 * Prefer this over {@link MatrixTransform.applyToPoint} whenever the result is written back into a
 * symbol: the raw form is for intermediate maths, where rounding at every step would accumulate.
 *
 * Returns a new point and leaves the argument untouched.
 *
 * @group Core/Geometry
 */
export function applyMatrixToPoint(point: TPoint, matrix: TMatrixTransform): TPoint {
  const transformed = MatrixTransform.applyToPoint(matrix, point)
  return { x: roundCoordinate(transformed.x), y: roundCoordinate(transformed.y) }
}

/**
 * The same, applied in place to every point of a list, so each point keeps its object identity.
 *
 * Lived as a `protected` method on the transform manager base until IIC-2010, where no symbol util
 * could reach it — which is half of why the managers rounded inconsistently.
 *
 * @group Core/Geometry
 */
export function applyMatrixToPoints(points: TPoint[], matrix: TMatrixTransform): void {
  points.forEach((point) => {
    const transformed = applyMatrixToPoint(point, matrix)
    point.x = transformed.x
    point.y = transformed.y
  })
}

/**
 * A document-space point mapped back into the frame a symbol's own coordinates live in.
 *
 * The mirror of {@link applyMatrixToPoint}, and needed wherever a value that came from the document
 * — a pointer position, or a point computed from another symbol's geometry — is written *into* a
 * symbol's stored coordinates. Those coordinates are raw: they are what the symbol was created with,
 * and its matrix is what puts it where the user sees it. Writing a document-space point straight
 * into them lands it wrong by exactly that matrix, which is why dragging one vertex of an
 * already-moved edge used to make it jump.
 *
 * Returns `undefined` when the matrix cannot be inverted — a symbol flattened to nothing on some
 * axis, or one whose determinant came out `NaN`. There is genuinely no raw point corresponding to a
 * document one in that state, so callers skip the write rather than storing a fabricated coordinate.
 *
 * Rounded to the three decimals the document stores, like {@link applyMatrixToPoint}: the result is
 * written back into a symbol, not used for intermediate maths.
 *
 * @group Core/Geometry
 */
export function applyInverseMatrixToPoint(point: TPoint, matrix: TMatrixTransform): TPoint | undefined {
  if (isIdentityMatrix(matrix)) {
    return { x: roundCoordinate(point.x), y: roundCoordinate(point.y) }
  }
  const determinant = matrix.xx * matrix.yy - matrix.yx * matrix.xy
  if (!Number.isFinite(determinant) || Math.abs(determinant) < INVERTIBLE_DETERMINANT_EPSILON) {
    return undefined
  }
  const inverse = new MatrixTransform(matrix.xx, matrix.yx, matrix.xy, matrix.yy, matrix.tx, matrix.ty).invert()
  return applyMatrixToPoint(point, inverse)
}

/**
 * Below this, a matrix is treated as non-invertible.
 *
 * The determinant is the product of the two scale factors, so 1e-9 means a uniform scale of about
 * 3.2e-5 — far smaller than anything visible, and three orders below a symbol scaled to a thousandth
 * of its size. The threshold below which a matrix is treated as non-invertible rather than divided by.
 */
const INVERTIBLE_DETERMINANT_EPSILON = 1e-9

/**
 * Whether this matrix leaves everything where it is.
 *
 * Worth asking before doing anything with it: the vast majority of symbols in a document were never
 * moved, and both the geometry pass and the renderer can skip their whole matrix path on this.
 *
 * @group Core/Geometry
 */
export function isIdentityMatrix(matrix: TMatrixTransform): boolean {
  return matrix.xx === 1 && matrix.yx === 0 && matrix.xy === 0 && matrix.yy === 1 && matrix.tx === 0 && matrix.ty === 0
}

/**
 * A transform partially specified in incoming data, filled out with the identity for whatever field
 * it left unset.
 *
 * Mirrors `mergeSymbolStyle`'s role for `TStyle`: every `*Ops.createFromPartial` deserialises data
 * that may predate this field, or may simply describe a symbol that was never moved, so `transform`
 * has to be optional on the wire even though `TBaseSymbol.transform` is not. Without this, a
 * `createFromPartial` that dropped an incoming `transform` would silently reset every deserialised
 * symbol to identity — invisible today, since nothing yet writes a non-identity one, but silent data
 * loss the moment something does.
 *
 * @group Core/Geometry
 */
export function mergeSymbolTransform(transform?: TPartialDeep<TMatrixTransform>): TMatrixTransform {
  return { ...MatrixTransform.identity(), ...transform }
}
