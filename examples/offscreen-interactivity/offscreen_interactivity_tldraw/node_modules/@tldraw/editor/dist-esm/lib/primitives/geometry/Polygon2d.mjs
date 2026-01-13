import { Polyline2d } from "./Polyline2d.mjs";
class Polygon2d extends Polyline2d {
  constructor(config) {
    super({ ...config });
    this.isClosed = true;
  }
}
export {
  Polygon2d
};
//# sourceMappingURL=Polygon2d.mjs.map
