import { Box } from "../Box.mjs";
import { Vec } from "../Vec.mjs";
import { intersectLineSegmentCircle } from "../intersect.mjs";
import { PI2, getPointOnCircle } from "../utils.mjs";
import { Geometry2d } from "./Geometry2d.mjs";
import { getVerticesCountForArcLength } from "./geometry-constants.mjs";
class Circle2d extends Geometry2d {
  constructor(config) {
    super({ isClosed: true, ...config });
    this.config = config;
    const { x = 0, y = 0, radius } = config;
    this._x = x;
    this._y = y;
    this._center = new Vec(radius + x, radius + y);
    this._radius = radius;
  }
  _center;
  _radius;
  _x;
  _y;
  getBounds() {
    return new Box(this._x, this._y, this._radius * 2, this._radius * 2);
  }
  getVertices() {
    const { _center, _radius: radius } = this;
    const perimeter = PI2 * radius;
    const vertices = [];
    for (let i = 0, n = getVerticesCountForArcLength(perimeter); i < n; i++) {
      const angle = i / n * PI2;
      vertices.push(getPointOnCircle(_center, radius, angle));
    }
    return vertices;
  }
  nearestPoint(point) {
    const { _center, _radius: radius } = this;
    if (_center.equals(point)) return Vec.AddXY(_center, radius, 0);
    return Vec.Sub(point, _center).uni().mul(radius).add(_center);
  }
  hitTestLineSegment(A, B, distance = 0) {
    const { _center, _radius: radius } = this;
    return intersectLineSegmentCircle(A, B, _center, radius + distance) !== null;
  }
  getSvgPathData() {
    const { _center, _radius: radius } = this;
    return `M${_center.x + radius},${_center.y} a${radius},${radius} 0 1,0 ${radius * 2},0a${radius},${radius} 0 1,0 -${radius * 2},0`;
  }
}
export {
  Circle2d
};
//# sourceMappingURL=Circle2d.mjs.map
