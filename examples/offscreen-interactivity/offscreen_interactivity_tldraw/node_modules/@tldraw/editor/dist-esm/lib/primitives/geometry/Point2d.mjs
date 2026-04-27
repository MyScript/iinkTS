import { Vec } from "../Vec.mjs";
import { Geometry2d } from "./Geometry2d.mjs";
class Point2d extends Geometry2d {
  _point;
  constructor(config) {
    super({ ...config, isClosed: true, isFilled: true });
    const { point } = config;
    this._point = point;
  }
  getVertices() {
    return [this._point];
  }
  nearestPoint() {
    return this._point;
  }
  hitTestLineSegment(A, B, margin) {
    return Vec.DistanceToLineSegment(A, B, this._point) < margin;
  }
  getSvgPathData() {
    const { _point: point } = this;
    return `M${point.toFixed()}`;
  }
}
export {
  Point2d
};
//# sourceMappingURL=Point2d.mjs.map
