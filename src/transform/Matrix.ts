import { Box, TBoundingBox, TPoint } from "../primitive"

/**
 * @group Transform
 * @remarks Represents a 2D affine transform, defined as a 3x3 matrix with an implicit third raw of <code>[ 0 0 1 ]</code>
 */
export type TMatrixTransform = {
  /**
   * @remarks scaling x
   */
  xx: number,
  /**
   * @remarks shearing x
   */
  yx: number,
  /**
   * @remarks translation x
   */
  tx: number,
  /**
   * @remarks shearing y
   */
  xy: number,
  /**
   * @remarks scaling y
   */
  yy: number,
  /**
   * @remarks translation y
   */
  ty: number,
}

/**
 * @group Transform
 * @remarks Represents a 2D affine transform, defined as a 3x3 matrix with an implicit third raw of <code>[ 0 0 1 ]</code>
 */
export class MatrixTransform implements TMatrixTransform
{
	xx: number
	yx: number
	xy: number
	yy: number
	tx: number
	ty: number

  constructor(xx: number, yx: number, xy: number, yy: number, tx: number, ty: number)
  {
    this.xx = xx
    this.yx = yx
    this.xy = xy
    this.yy = yy
    this.tx = tx
    this.ty = ty
  }

	static identity(): TMatrixTransform {
    return {
      xx: 1,
      yx: 0,
      xy: 0,
      yy: 1,
      tx: 0,
      ty: 0
    }
	}

	static applyToPoint(mat: TMatrixTransform, point: TPoint): TPoint
	{
		return {
			x: mat.xx * point.x + mat.yx * point.y + mat.tx,
			y: mat.xy * point.x + mat.yy * point.y + mat.ty,
    }
	}

	static applyToBox(mat: TMatrixTransform, box: TBoundingBox): Box
	{
		return new Box(mat.tx + box.x, mat.ty + box.y, box.width, box.height)
	}

  static toCssString(matrix: TMatrixTransform): string
  {
    return `matrix(${matrix.xx}, ${matrix.yx}, ${matrix.xy}, ${matrix.yy}, ${matrix.tx}, ${matrix.ty})`
  }

	multiply(m: TMatrixTransform): void
  {
    const { xx, yx, xy, yy, tx, ty } = this
		this.xx = xx * m.xx + xy * m.yx
		this.yx = yx * m.xx + yy * m.yx
		this.xy = xx * m.xy + xy * m.yy
		this.yy = yx * m.xy + yy * m.yy
		this.tx = xx * m.tx + xy * m.ty + tx
		this.ty = yx * m.tx + yy * m.ty + ty
	}

  translate(tx: number, ty: number): void
  {
    this.multiply({
      xx: 1,
      yx: 0,
      xy: 0,
      yy: 1,
      tx,
      ty
    })
  }

  rotate(radian: number, center: TPoint): void
  {
    this.translate(center.x, center.y)
		const cosAngle = Math.round(Math.cos(radian) * 1000) / 1000
		const sinAngle = Math.round(Math.sin(radian) * 1000) / 1000
    this.multiply({
      xx: cosAngle,
      yx: sinAngle,
      xy: -sinAngle,
      yy: cosAngle,
      tx: 0,
      ty: 0
    })
    this.translate(-center.x, -center.y)
  }

  scale(x: number, y: number): void
  {
    this.multiply({
      xx: x,
      yx: 0,
      xy: 0,
      yy: y,
      tx: 0,
      ty: 0
    })
  }

  getClone(): MatrixTransform
  {
    return new MatrixTransform(this.xx, this.yx, this.xy, this.yy, this.tx, this.ty)
  }

}
