"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var svgInk_exports = {};
__export(svgInk_exports, {
  svgInk: () => svgInk
});
module.exports = __toCommonJS(svgInk_exports);
var import_editor = require("@tldraw/editor");
var import_getStrokeOutlinePoints = require("./getStrokeOutlinePoints");
var import_getStrokePoints = require("./getStrokePoints");
var import_setStrokePointRadii = require("./setStrokePointRadii");
function svgInk(rawInputPoints, options = {}) {
  const { start = {}, end = {} } = options;
  const { cap: capStart = true } = start;
  const { cap: capEnd = true } = end;
  (0, import_editor.assert)(!start.taper && !end.taper, "cap taper not supported here");
  (0, import_editor.assert)(!start.easing && !end.easing, "cap easing not supported here");
  (0, import_editor.assert)(capStart && capEnd, "cap must be true");
  const points = (0, import_getStrokePoints.getStrokePoints)(rawInputPoints, options);
  (0, import_setStrokePointRadii.setStrokePointRadii)(points, options);
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
  let prevV = import_editor.Vec.Sub(points[1].point, points[0].point).uni();
  let nextV;
  let dpr;
  let prevPoint, thisPoint, nextPoint;
  for (let i = 1, n = points.length; i < n - 1; i++) {
    prevPoint = points[i - 1];
    thisPoint = points[i];
    nextPoint = points[i + 1];
    nextV = import_editor.Vec.Sub(nextPoint.point, thisPoint.point).uni();
    dpr = import_editor.Vec.Dpr(prevV, nextV);
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
    if ((import_editor.Vec.Dist2(prevPoint.point, thisPoint.point) + import_editor.Vec.Dist2(thisPoint.point, nextPoint.point)) / ((prevPoint.radius + thisPoint.radius + nextPoint.radius) / 3) ** 2 < 1.5) {
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
    if (import_editor.Vec.Dist2(startPoint.point, nextPoint.point) < ((startPoint.radius + nextPoint.radius) / 2 * 0.5) ** 2) {
      partition.splice(1, 1);
    } else {
      break;
    }
  }
  const endPoint = partition[partition.length - 1];
  let prevPoint;
  while (partition.length > 2) {
    prevPoint = partition[partition.length - 2];
    if (import_editor.Vec.Dist2(endPoint.point, prevPoint.point) < ((endPoint.radius + prevPoint.radius) / 2 * 0.5) ** 2) {
      partition.splice(partition.length - 2, 1);
    } else {
      break;
    }
  }
  if (partition.length > 1) {
    partition[0] = {
      ...partition[0],
      vector: import_editor.Vec.Sub(partition[0].point, partition[1].point).uni()
    };
    partition[partition.length - 1] = {
      ...partition[partition.length - 1],
      vector: import_editor.Vec.Sub(
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
  const { left, right } = (0, import_getStrokeOutlinePoints.getStrokeOutlineTracks)(strokePoints, options);
  right.reverse();
  let svg = `M${(0, import_editor.precise)(left[0])}T`;
  for (let i = 1; i < left.length; i++) {
    svg += (0, import_editor.average)(left[i - 1], left[i]);
  }
  {
    const point = strokePoints[strokePoints.length - 1];
    const radius = point.radius;
    const direction = point.vector.clone().per().neg();
    const arcStart = import_editor.Vec.Add(point.point, import_editor.Vec.Mul(direction, radius));
    const arcEnd = import_editor.Vec.Add(point.point, import_editor.Vec.Mul(direction, -radius));
    svg += `${(0, import_editor.precise)(arcStart)}A${(0, import_editor.toDomPrecision)(radius)},${(0, import_editor.toDomPrecision)(
      radius
    )} 0 0 1 ${(0, import_editor.precise)(arcEnd)}T`;
  }
  for (let i = 1; i < right.length; i++) {
    svg += (0, import_editor.average)(right[i - 1], right[i]);
  }
  {
    const point = strokePoints[0];
    const radius = point.radius;
    const direction = point.vector.clone().per();
    const arcStart = import_editor.Vec.Add(point.point, import_editor.Vec.Mul(direction, radius));
    const arcEnd = import_editor.Vec.Add(point.point, import_editor.Vec.Mul(direction, -radius));
    svg += `${(0, import_editor.precise)(arcStart)}A${(0, import_editor.toDomPrecision)(radius)},${(0, import_editor.toDomPrecision)(
      radius
    )} 0 0 1 ${(0, import_editor.precise)(arcEnd)}Z`;
  }
  return svg;
}
//# sourceMappingURL=svgInk.js.map
