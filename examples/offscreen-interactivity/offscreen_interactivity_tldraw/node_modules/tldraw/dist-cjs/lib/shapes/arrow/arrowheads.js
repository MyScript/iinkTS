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
var arrowheads_exports = {};
__export(arrowheads_exports, {
  getArrowheadPathForType: () => getArrowheadPathForType
});
module.exports = __toCommonJS(arrowheads_exports);
var import_editor = require("@tldraw/editor");
function getArrowPoints(info, side, strokeWidth) {
  const PT = side === "end" ? info.end.point : info.start.point;
  const PB = side === "end" ? info.start.point : info.end.point;
  const compareLength = info.isStraight ? import_editor.Vec.Dist(PB, PT) : Math.abs(info.bodyArc.length);
  const length = Math.max(Math.min(compareLength / 5, strokeWidth * 3), strokeWidth);
  let P0;
  if (info.isStraight) {
    P0 = import_editor.Vec.Nudge(PT, PB, length);
  } else {
    const ints = (0, import_editor.intersectCircleCircle)(PT, length, info.handleArc.center, info.handleArc.radius);
    P0 = side === "end" ? info.handleArc.sweepFlag ? ints[0] : ints[1] : info.handleArc.sweepFlag ? ints[1] : ints[0];
  }
  if (import_editor.Vec.IsNaN(P0)) {
    P0 = info.start.point;
  }
  return {
    point: PT,
    int: P0
  };
}
function getArrowhead({ point, int }) {
  const PL = import_editor.Vec.RotWith(int, point, import_editor.PI / 6);
  const PR = import_editor.Vec.RotWith(int, point, -import_editor.PI / 6);
  return `M ${PL.x} ${PL.y} L ${point.x} ${point.y} L ${PR.x} ${PR.y}`;
}
function getTriangleHead({ point, int }) {
  const PL = import_editor.Vec.RotWith(int, point, import_editor.PI / 6);
  const PR = import_editor.Vec.RotWith(int, point, -import_editor.PI / 6);
  return `M ${PL.x} ${PL.y} L ${PR.x} ${PR.y} L ${point.x} ${point.y} Z`;
}
function getInvertedTriangleHead({ point, int }) {
  const d = import_editor.Vec.Sub(int, point).div(2);
  const PL = import_editor.Vec.Add(point, import_editor.Vec.Rot(d, import_editor.HALF_PI));
  const PR = import_editor.Vec.Sub(point, import_editor.Vec.Rot(d, import_editor.HALF_PI));
  return `M ${PL.x} ${PL.y} L ${int.x} ${int.y} L ${PR.x} ${PR.y} Z`;
}
function getDotHead({ point, int }) {
  const A = import_editor.Vec.Lrp(point, int, 0.45);
  const r = import_editor.Vec.Dist(A, point);
  return `M ${A.x - r},${A.y}
  a ${r},${r} 0 1,0 ${r * 2},0
  a ${r},${r} 0 1,0 -${r * 2},0 `;
}
function getDiamondHead({ point, int }) {
  const PB = import_editor.Vec.Lrp(point, int, 0.75);
  const PL = import_editor.Vec.RotWith(PB, point, import_editor.PI / 4);
  const PR = import_editor.Vec.RotWith(PB, point, -import_editor.PI / 4);
  const PQ = import_editor.Vec.Lrp(PL, PR, 0.5);
  PQ.add(import_editor.Vec.Sub(PQ, point));
  return `M ${PQ.x} ${PQ.y} L ${PR.x} ${PR.y} ${point.x} ${point.y} L ${PL.x} ${PL.y} Z`;
}
function getSquareHead({ int, point }) {
  const PB = import_editor.Vec.Lrp(point, int, 0.85);
  const d = import_editor.Vec.Sub(PB, point).div(2);
  const PL1 = import_editor.Vec.Add(point, import_editor.Vec.Rot(d, import_editor.HALF_PI));
  const PR1 = import_editor.Vec.Sub(point, import_editor.Vec.Rot(d, import_editor.HALF_PI));
  const PL2 = import_editor.Vec.Add(PB, import_editor.Vec.Rot(d, import_editor.HALF_PI));
  const PR2 = import_editor.Vec.Sub(PB, import_editor.Vec.Rot(d, import_editor.HALF_PI));
  return `M ${PL1.x} ${PL1.y} L ${PL2.x} ${PL2.y} L ${PR2.x} ${PR2.y} L ${PR1.x} ${PR1.y} Z`;
}
function getBarHead({ int, point }) {
  const d = import_editor.Vec.Sub(int, point).div(2);
  const PL = import_editor.Vec.Add(point, import_editor.Vec.Rot(d, import_editor.HALF_PI));
  const PR = import_editor.Vec.Sub(point, import_editor.Vec.Rot(d, import_editor.HALF_PI));
  return `M ${PL.x} ${PL.y} L ${PR.x} ${PR.y}`;
}
function getArrowheadPathForType(info, side, strokeWidth) {
  const type = side === "end" ? info.end.arrowhead : info.start.arrowhead;
  if (type === "none") return;
  const points = getArrowPoints(info, side, strokeWidth);
  if (!points) return;
  switch (type) {
    case "bar":
      return getBarHead(points);
    case "square":
      return getSquareHead(points);
    case "diamond":
      return getDiamondHead(points);
    case "dot":
      return getDotHead(points);
    case "inverted":
      return getInvertedTriangleHead(points);
    case "arrow":
      return getArrowhead(points);
    case "triangle":
      return getTriangleHead(points);
  }
  return "";
}
//# sourceMappingURL=arrowheads.js.map
