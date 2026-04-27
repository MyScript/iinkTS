import { Vec } from "../Vec.mjs";
import { Edge2d } from "./Edge2d.mjs";
import { Geometry2d } from "./Geometry2d.mjs";
class Polyline2d extends Geometry2d {
  _points;
  _segments;
  constructor(config) {
    super({ isClosed: false, isFilled: false, ...config });
    const { points } = config;
    this._points = points;
    if (points.length < 2) {
      throw new Error("Polyline2d: points must be an array of at least 2 points");
    }
  }
  // eslint-disable-next-line no-restricted-syntax
  get segments() {
    if (!this._segments) {
      this._segments = [];
      const { vertices } = this;
      for (let i = 0, n = vertices.length - 1; i < n; i++) {
        const start = vertices[i];
        const end = vertices[i + 1];
        this._segments.push(new Edge2d({ start, end }));
      }
      if (this.isClosed) {
        this._segments.push(new Edge2d({ start: vertices[vertices.length - 1], end: vertices[0] }));
      }
    }
    return this._segments;
  }
  getLength() {
    return this.segments.reduce((acc, segment) => acc + segment.length, 0);
  }
  getVertices() {
    return this._points;
  }
  nearestPoint(A) {
    const { segments } = this;
    let nearest = this._points[0];
    let dist = Infinity;
    let p;
    let d;
    for (let i = 0; i < segments.length; i++) {
      p = segments[i].nearestPoint(A);
      d = Vec.Dist2(p, A);
      if (d < dist) {
        nearest = p;
        dist = d;
      }
    }
    if (!nearest) throw Error("nearest point not found");
    return nearest;
  }
  hitTestLineSegment(A, B, distance = 0) {
    const { segments } = this;
    for (let i = 0, n = segments.length; i < n; i++) {
      if (segments[i].hitTestLineSegment(A, B, distance)) {
        return true;
      }
    }
    return false;
  }
  getSvgPathData() {
    const { vertices } = this;
    if (vertices.length < 2) return "";
    return vertices.reduce((acc, vertex, i) => {
      if (i === 0) return `M ${vertex.x} ${vertex.y}`;
      return `${acc} L ${vertex.x} ${vertex.y}`;
    }, "");
  }
}
export {
  Polyline2d
};
//# sourceMappingURL=Polyline2d.mjs.map
