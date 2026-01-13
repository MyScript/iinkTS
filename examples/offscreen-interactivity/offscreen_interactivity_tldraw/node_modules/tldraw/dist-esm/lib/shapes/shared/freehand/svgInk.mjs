import { Vec, assert, average, precise, toDomPrecision } from "@tldraw/editor";
import { getStrokeOutlineTracks } from "./getStrokeOutlinePoints.mjs";
import { getStrokePoints } from "./getStrokePoints.mjs";
import { setStrokePointRadii } from "./setStrokePointRadii.mjs";
function svgInk(rawInputPoints, options = {}) {
  const { start = {}, end = {} } = options;
  const { cap: capStart = true } = start;
  const { cap: capEnd = true } = end;
  assert(!start.taper && !end.taper, "cap taper not supported here");
  assert(!start.easing && !end.easing, "cap easing not supported here");
  assert(capStart && capEnd, "cap must be true");
  const points = getStrokePoints(rawInputPoints, options);
  setStrokePointRadii(points, options);
  const partitions = partitionAtElbows(points);
  let svg = "";
  for (const partition of partitions) {
    svg += renderPartition(partition, options);
  }
  return svg;
}
function partitionAtElbows(points) {
  if (points.length <= 2) return [points];
  const result = [];
  let currentPartition = [points[0]];
  let prevV = Vec.Sub(points[1].point, points[0].point).uni();
  let nextV;
  let dpr;
  let prevPoint, thisPoint, nextPoint;
  for (let i = 1, n = points.length; i < n - 1; i++) {
    prevPoint = points[i - 1];
    thisPoint = points[i];
    nextPoint = points[i + 1];
    nextV = Vec.Sub(nextPoint.point, thisPoint.point).uni();
    dpr = Vec.Dpr(prevV, nextV);
    prevV = nextV;
    if (dpr < -0.8) {
      const elbowPoint = {
        ...thisPoint,
        point: thisPoint.input
      };
      currentPartition.push(elbowPoint);
      result.push(cleanUpPartition(currentPartition));
      currentPartition = [elbowPoint];
      continue;
    }
    currentPartition.push(thisPoint);
    if (dpr > 0.7) {
      continue;
    }
    if ((Vec.Dist2(prevPoint.point, thisPoint.point) + Vec.Dist2(thisPoint.point, nextPoint.point)) / ((prevPoint.radius + thisPoint.radius + nextPoint.radius) / 3) ** 2 < 1.5) {
      currentPartition.push(thisPoint);
      result.push(cleanUpPartition(currentPartition));
      currentPartition = [thisPoint];
      continue;
    }
  }
  currentPartition.push(points[points.length - 1]);
  result.push(cleanUpPartition(currentPartition));
  return result;
}
function cleanUpPartition(partition) {
  const startPoint = partition[0];
  let nextPoint;
  while (partition.length > 2) {
    nextPoint = partition[1];
    if (Vec.Dist2(startPoint.point, nextPoint.point) < ((startPoint.radius + nextPoint.radius) / 2 * 0.5) ** 2) {
      partition.splice(1, 1);
    } else {
      break;
    }
  }
  const endPoint = partition[partition.length - 1];
  let prevPoint;
  while (partition.length > 2) {
    prevPoint = partition[partition.length - 2];
    if (Vec.Dist2(endPoint.point, prevPoint.point) < ((endPoint.radius + prevPoint.radius) / 2 * 0.5) ** 2) {
      partition.splice(partition.length - 2, 1);
    } else {
      break;
    }
  }
  if (partition.length > 1) {
    partition[0] = {
      ...partition[0],
      vector: Vec.Sub(partition[0].point, partition[1].point).uni()
    };
    partition[partition.length - 1] = {
      ...partition[partition.length - 1],
      vector: Vec.Sub(
        partition[partition.length - 2].point,
        partition[partition.length - 1].point
      ).uni()
    };
  }
  return partition;
}
function circlePath(cx, cy, r) {
  return "M " + cx + " " + cy + " m -" + r + ", 0 a " + r + "," + r + " 0 1,1 " + r * 2 + ",0 a " + r + "," + r + " 0 1,1 -" + r * 2 + ",0";
}
function renderPartition(strokePoints, options = {}) {
  if (strokePoints.length === 0) return "";
  if (strokePoints.length === 1) {
    return circlePath(strokePoints[0].point.x, strokePoints[0].point.y, strokePoints[0].radius);
  }
  const { left, right } = getStrokeOutlineTracks(strokePoints, options);
  right.reverse();
  let svg = `M${precise(left[0])}T`;
  for (let i = 1; i < left.length; i++) {
    svg += average(left[i - 1], left[i]);
  }
  {
    const point = strokePoints[strokePoints.length - 1];
    const radius = point.radius;
    const direction = point.vector.clone().per().neg();
    const arcStart = Vec.Add(point.point, Vec.Mul(direction, radius));
    const arcEnd = Vec.Add(point.point, Vec.Mul(direction, -radius));
    svg += `${precise(arcStart)}A${toDomPrecision(radius)},${toDomPrecision(
      radius
    )} 0 0 1 ${precise(arcEnd)}T`;
  }
  for (let i = 1; i < right.length; i++) {
    svg += average(right[i - 1], right[i]);
  }
  {
    const point = strokePoints[0];
    const radius = point.radius;
    const direction = point.vector.clone().per();
    const arcStart = Vec.Add(point.point, Vec.Mul(direction, radius));
    const arcEnd = Vec.Add(point.point, Vec.Mul(direction, -radius));
    svg += `${precise(arcStart)}A${toDomPrecision(radius)},${toDomPrecision(
      radius
    )} 0 0 1 ${precise(arcEnd)}Z`;
  }
  return svg;
}
export {
  svgInk
};
//# sourceMappingURL=svgInk.mjs.map
