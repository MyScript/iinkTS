import { Vec } from "@tldraw/editor";
const MIN_START_PRESSURE = 0.025;
const MIN_END_PRESSURE = 0.01;
function getStrokePoints(rawInputPoints, options = {}) {
  const { streamline = 0.5, size = 16, simulatePressure = false } = options;
  if (rawInputPoints.length === 0) return [];
  const t = 0.15 + (1 - streamline) * 0.85;
  let pts = rawInputPoints.map(Vec.From);
  let pointsRemovedFromNearEnd = 0;
  if (!simulatePressure) {
    let pt2 = pts[0];
    while (pt2) {
      if (pt2.z >= MIN_START_PRESSURE) break;
      pts.shift();
      pt2 = pts[0];
    }
  }
  if (!simulatePressure) {
    let pt2 = pts[pts.length - 1];
    while (pt2) {
      if (pt2.z >= MIN_END_PRESSURE) break;
      pts.pop();
      pt2 = pts[pts.length - 1];
    }
  }
  if (pts.length === 0)
    return [
      {
        point: Vec.From(rawInputPoints[0]),
        input: Vec.From(rawInputPoints[0]),
        pressure: simulatePressure ? 0.5 : 0.15,
        vector: new Vec(1, 1),
        distance: 0,
        runningLength: 0,
        radius: 1
      }
    ];
  let pt = pts[1];
  while (pt) {
    if (Vec.Dist2(pt, pts[0]) > (size / 3) ** 2) break;
    pts[0].z = Math.max(pts[0].z, pt.z);
    pts.splice(1, 1);
    pt = pts[1];
  }
  const last = pts.pop();
  pt = pts[pts.length - 1];
  while (pt) {
    if (Vec.Dist2(pt, last) > (size / 3) ** 2) break;
    pts.pop();
    pt = pts[pts.length - 1];
    pointsRemovedFromNearEnd++;
  }
  pts.push(last);
  const isComplete = options.last || !options.simulatePressure || pts.length > 1 && Vec.Dist2(pts[pts.length - 1], pts[pts.length - 2]) < size ** 2 || pointsRemovedFromNearEnd > 0;
  if (pts.length === 2 && options.simulatePressure) {
    const last2 = pts[1];
    pts = pts.slice(0, -1);
    for (let i = 1; i < 5; i++) {
      const next = Vec.Lrp(pts[0], last2, i / 4);
      next.z = (pts[0].z + (last2.z - pts[0].z)) * i / 4;
      pts.push(next);
    }
  }
  const strokePoints = [
    {
      point: pts[0],
      input: pts[0],
      pressure: simulatePressure ? 0.5 : pts[0].z,
      vector: new Vec(1, 1),
      distance: 0,
      runningLength: 0,
      radius: 1
    }
  ];
  let totalLength = 0;
  let prev = strokePoints[0];
  let point, distance;
  if (isComplete && streamline > 0) {
    pts.push(pts[pts.length - 1].clone());
  }
  for (let i = 1, n = pts.length; i < n; i++) {
    point = !t || options.last && i === n - 1 ? pts[i].clone() : pts[i].clone().lrp(prev.point, 1 - t);
    if (prev.point.equals(point)) continue;
    distance = Vec.Dist(point, prev.point);
    totalLength += distance;
    if (i < 4 && totalLength < size) {
      continue;
    }
    prev = {
      input: pts[i],
      // The adjusted point
      point,
      // The input pressure (or .5 if not specified)
      pressure: simulatePressure ? 0.5 : pts[i].z,
      // The vector from the current point to the previous point
      vector: Vec.Sub(prev.point, point).uni(),
      // The distance between the current point and the previous point
      distance,
      // The total distance so far
      runningLength: totalLength,
      // The stroke point's radius
      radius: 1
    };
    strokePoints.push(prev);
  }
  if (strokePoints[1]?.vector) {
    strokePoints[0].vector = strokePoints[1].vector.clone();
  }
  if (totalLength < 1) {
    const maxPressureAmongPoints = Math.max(0.5, ...strokePoints.map((s) => s.pressure));
    strokePoints.forEach((s) => s.pressure = maxPressureAmongPoints);
  }
  return strokePoints;
}
export {
  getStrokePoints
};
//# sourceMappingURL=getStrokePoints.mjs.map
