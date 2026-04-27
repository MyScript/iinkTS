import { Polyline2d } from "./Polyline2d.mjs";
class Polygon2d extends Polyline2d {
  constructor(config) {
    super({ ...config });
    this.isClosed = true;
    if (config.points.length < 3) {
      throw new Error("Polygon2d: points must be an array of at least 3 points");
    }
  }
}
export {
  Polygon2d
};
//# sourceMappingURL=Polygon2d.mjs.map
