import { Box } from "../Box.mjs";
import { Vec } from "../Vec.mjs";
import { Polygon2d } from "./Polygon2d.mjs";
class Rectangle2d extends Polygon2d {
  _x;
  _y;
  _w;
  _h;
  constructor(config) {
    const { x = 0, y = 0, width, height } = config;
    super({
      ...config,
      points: [
        new Vec(x, y),
        new Vec(x + width, y),
        new Vec(x + width, y + height),
        new Vec(x, y + height)
      ]
    });
    this._x = x;
    this._y = y;
    this._w = width;
    this._h = height;
  }
  getBounds() {
    return new Box(this._x, this._y, this._w, this._h);
  }
  getSvgPathData() {
    const { _x: x, _y: y, _w: w, _h: h } = this;
    this.negativeZeroFix();
    return `M${x},${y} h${w} v${h} h${-w}z`;
  }
  negativeZeroFix() {
    this._x = zeroFix(this._x);
    this._y = zeroFix(this._y);
    this._w = zeroFix(this._w);
    this._h = zeroFix(this._h);
  }
}
function zeroFix(value) {
  if (Object.is(value, -0)) return 0;
  return value;
}
export {
  Rectangle2d
};
//# sourceMappingURL=Rectangle2d.mjs.map
