/**
 * @group Utils
 * @group Math
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

	multiply(m: TMatrixTransform): void
  {
		this.xx = this.xx * m.xx + this.xy * m.yx
		this.yx = this.yx * m.xx + this.yy * m.yx
		this.xy = this.xx * m.xy + this.xy * m.yy
		this.yy = this.yx * m.xy + this.yy * m.yy
		this.tx = this.xx * m.tx + this.xy * m.ty + this.tx
		this.ty = this.yx * m.tx + this.yy * m.ty + this.ty
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

  rotate(radian: number): void
  {
		const cosAngle = Math.cos(radian)
		const sinAngle = Math.sin(radian)
    this.multiply({
      xx: cosAngle,
      yx: sinAngle,
      xy: -sinAngle,
      yy: cosAngle,
      tx: 0,
      ty: 0
    })
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
}
