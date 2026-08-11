import { Vec } from "../Vec.mjs";
import { Polyline2d } from "./Polyline2d.mjs";
class CubicBezier2d extends Polyline2d {
  _a;
  _b;
  _c;
  _d;
  _resolution;
  constructor(config) {
    const { start: a, cp1: b, cp2: c, end: d } = config;
    super({ ...config, points: [a, d] });
    this._a = a;
    this._b = b;
    this._c = c;
    this._d = d;
    this._resolution = config.resolution ?? 10;
  }
  getVertices() {
    const vertices = [];
    const { _a: a, _b: b, _c: c, _d: d } = this;
    for (let i = 0, n = this._resolution; i <= n; i++) {
      const t = i / n;
      vertices.push(
        new Vec(
          (1 - t) * (1 - t) * (1 - t) * a.x + 3 * ((1 - t) * (1 - t)) * t * b.x + 3 * (1 - t) * (t * t) * c.x + t * t * t * d.x,
          (1 - t) * (1 - t) * (1 - t) * a.y + 3 * ((1 - t) * (1 - t)) * t * b.y + 3 * (1 - t) * (t * t) * c.y + t * t * t * d.y
        )
      );
    }
    return vertices;
  }
  nearestPoint(A) {
    let nearest;
    let dist = Infinity;
    let d;
    let p;
    for (const edge of this.segments) {
      p = edge.nearestPoint(A);
      d = Vec.Dist2(p, A);
      if (d < dist) {
        nearest = p;
        dist = d;
      }
    }
    if (!nearest) throw Error("nearest point not found");
    return nearest;
  }
  getSvgPathData(first = true) {
    const { _a: a, _b: b, _c: c, _d: d } = this;
    return `${first ? `M ${a.toFixed()} ` : ``} C${b.toFixed()} ${c.toFixed()} ${d.toFixed()}`;
  }
  static GetAtT(segment, t) {
    const { _a: a, _b: b, _c: c, _d: d } = segment;
    return new Vec(
      (1 - t) * (1 - t) * (1 - t) * a.x + 3 * ((1 - t) * (1 - t)) * t * b.x + 3 * (1 - t) * (t * t) * c.x + t * t * t * d.x,
      (1 - t) * (1 - t) * (1 - t) * a.y + 3 * ((1 - t) * (1 - t)) * t * b.y + 3 * (1 - t) * (t * t) * c.y + t * t * t * d.y
    );
  }
  getLength(_filters, precision = 32) {
    let n1, p1 = this._a, length = 0;
    for (let i = 1; i <= precision; i++) {
      n1 = CubicBezier2d.GetAtT(this, i / precision);
      length += Vec.Dist(p1, n1);
      p1 = n1;
    }
    return length;
  }
}
export {
  CubicBezier2d
};
//# sourceMappingURL=CubicBezier2d.mjs.map
