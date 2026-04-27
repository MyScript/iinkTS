import { Vec } from "../Vec.mjs";
import { Geometry2d } from "./Geometry2d.mjs";
class Edge2d extends Geometry2d {
  _start;
  _end;
  _d;
  _u;
  _ul;
  constructor(config) {
    super({ ...config, isClosed: false, isFilled: false });
    const { start, end } = config;
    this._start = start;
    this._end = end;
    this._d = start.clone().sub(end);
    this._u = this._d.clone().uni();
    this._ul = this._u.len();
  }
  getLength() {
    return this._d.len();
  }
  getVertices() {
    return [this._start, this._end];
  }
  nearestPoint(point) {
    const { _start: start, _end: end, _d: d, _u: u, _ul: l } = this;
    if (d.len() === 0) return start;
    if (l === 0) return start;
    const k = Vec.Sub(point, start).dpr(u) / l;
    const cx = start.x + u.x * k;
    if (cx < Math.min(start.x, end.x)) return start.x < end.x ? start : end;
    if (cx > Math.max(start.x, end.x)) return start.x > end.x ? start : end;
    const cy = start.y + u.y * k;
    if (cy < Math.min(start.y, end.y)) return start.y < end.y ? start : end;
    if (cy > Math.max(start.y, end.y)) return start.y > end.y ? start : end;
    return new Vec(cx, cy);
  }
  getSvgPathData(first = true) {
    const { _start: start, _end: end } = this;
    return `${first ? `M${start.toFixed()}` : ``} L${end.toFixed()}`;
  }
}
export {
  Edge2d
};
//# sourceMappingURL=Edge2d.mjs.map
