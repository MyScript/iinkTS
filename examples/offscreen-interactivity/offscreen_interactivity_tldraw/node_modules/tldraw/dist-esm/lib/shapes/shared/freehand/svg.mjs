import { average, precise } from "@tldraw/editor";
function getSvgPathFromStrokePoints(points, closed = false) {
  const len = points.length;
  if (len < 2) {
    return "";
  }
  let a = points[0].point;
  let b = points[1].point;
  if (len === 2) {
    return `M${precise(a)}L${precise(b)}`;
  }
  let result = "";
  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i].point;
    b = points[i + 1].point;
    result += average(a, b);
  }
  if (closed) {
    return `M${average(points[0].point, points[1].point)}Q${precise(points[1].point)}${average(
      points[1].point,
      points[2].point
    )}T${result}${average(points[len - 1].point, points[0].point)}${average(
      points[0].point,
      points[1].point
    )}Z`;
  } else {
    return `M${precise(points[0].point)}Q${precise(points[1].point)}${average(
      points[1].point,
      points[2].point
    )}${points.length > 3 ? "T" : ""}${result}L${precise(points[len - 1].point)}`;
  }
}
export {
  getSvgPathFromStrokePoints
};
//# sourceMappingURL=svg.mjs.map
