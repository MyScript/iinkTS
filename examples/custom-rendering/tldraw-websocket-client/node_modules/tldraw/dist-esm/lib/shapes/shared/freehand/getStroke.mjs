import { getStrokeOutlinePoints } from "./getStrokeOutlinePoints.mjs";
import { getStrokePoints } from "./getStrokePoints.mjs";
import { setStrokePointRadii } from "./setStrokePointRadii.mjs";
function getStroke(points, options = {}) {
  return getStrokeOutlinePoints(
    setStrokePointRadii(getStrokePoints(points, options), options),
    options
  );
}
export {
  getStroke
};
//# sourceMappingURL=getStroke.mjs.map
