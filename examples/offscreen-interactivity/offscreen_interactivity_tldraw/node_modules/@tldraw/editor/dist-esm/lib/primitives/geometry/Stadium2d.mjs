import { Box } from "../Box.mjs";
import { Vec } from "../Vec.mjs";
import { PI } from "../utils.mjs";
import { Arc2d } from "./Arc2d.mjs";
import { Edge2d } from "./Edge2d.mjs";
import { Geometry2d } from "./Geometry2d.mjs";
class Stadium2d extends Geometry2d {
  constructor(config) {
    super({ ...config, isClosed: true });
    this.config = config;
    const { width: w, height: h } = config;
    this._w = w;
    this._h = h;
    if (h > w) {
      const r = w / 2;
      this._a = new Arc2d({
        start: new Vec(0, r),
        end: new Vec(w, r),
        center: new Vec(w / 2, r),
        sweepFlag: 1,
        largeArcFlag: 1
      });
      this._b = new Edge2d({ start: new Vec(w, r), end: new Vec(w, h - r) });
      this._c = new Arc2d({
        start: new Vec(w, h - r),
        end: new Vec(0, h - r),
        center: new Vec(w / 2, h - r),
        sweepFlag: 1,
        largeArcFlag: 1
      });
      this._d = new Edge2d({ start: new Vec(0, h - r), end: new Vec(0, r) });
    } else {
      const r = h / 2;
      this._a = new Arc2d({
        start: new Vec(r, h),
        end: new Vec(r, 0),
        center: new Vec(r, r),
        sweepFlag: 1,
        largeArcFlag: 1
      });
      this._b = new Edge2d({ start: new Vec(r, 0), end: new Vec(w - r, 0) });
      this._c = new Arc2d({
        start: new Vec(w - r, 0),
        end: new Vec(w - r, h),
        center: new Vec(w - r, r),
        sweepFlag: 1,
        largeArcFlag: 1
      });
      this._d = new Edge2d({ start: new Vec(w - r, h), end: new Vec(r, h) });
    }
  }
  _w;
  _h;
  _a;
  _b;
  _c;
  _d;
  nearestPoint(A) {
    let nearest;
    let dist = Infinity;
    let _d;
    let p;
    const { _a: a, _b: b, _c: c, _d: d } = this;
    for (const part of [a, b, c, d]) {
      p = part.nearestPoint(A);
      _d = Vec.Dist2(p, A);
      if (_d < dist) {
        nearest = p;
        dist = _d;
      }
    }
    if (!nearest) throw Error("nearest point not found");
    return nearest;
  }
  hitTestLineSegment(A, B) {
    const { _a: a, _b: b, _c: c, _d: d } = this;
    return [a, b, c, d].some((edge) => edge.hitTestLineSegment(A, B));
  }
  getVertices() {
    const { _a: a, _b: b, _c: c, _d: d } = this;
    return [a, b, c, d].reduce((a2, p) => {
      a2.push(...p.vertices);
      return a2;
    }, []);
  }
  getBounds() {
    return new Box(0, 0, this._w, this._h);
  }
  getLength() {
    const { _h: h, _w: w } = this;
    if (h > w) return (PI * (w / 2) + (h - w)) * 2;
    else return (PI * (h / 2) + (w - h)) * 2;
  }
  getSvgPathData() {
    const { _a: a, _b: b, _c: c, _d: d } = this;
    return [a, b, c, d].map((p, i) => p.getSvgPathData(i === 0)).join(" ") + " Z";
  }
}
export {
  Stadium2d
};
//# sourceMappingURL=Stadium2d.mjs.map
