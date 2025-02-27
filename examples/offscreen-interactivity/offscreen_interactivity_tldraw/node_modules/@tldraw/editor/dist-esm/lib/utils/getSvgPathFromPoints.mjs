import { average, precise } from "../primitives/utils.mjs";
function getSvgPathFromPoints(points, closed = true) {
  const len = points.length;
  if (len < 2) {
    return "";
  }
  let a = points[0];
  let b = points[1];
  if (len === 2) {
    return `M${precise(a)}L${precise(b)}`;
  }
  let result = "";
  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += average(a, b);
  }
  if (closed) {
    return `M${average(points[0], points[1])}Q${precise(points[1])}${average(
      points[1],
      points[2]
    )}T${result}${average(points[len - 1], points[0])}${average(points[0], points[1])}Z`;
  } else {
    return `M${precise(points[0])}Q${precise(points[1])}${average(points[1], points[2])}${points.length > 3 ? "T" : ""}${result}L${precise(points[len - 1])}`;
  }
}
export {
  getSvgPathFromPoints
};
//# sourceMappingURL=getSvgPathFromPoints.mjs.map
