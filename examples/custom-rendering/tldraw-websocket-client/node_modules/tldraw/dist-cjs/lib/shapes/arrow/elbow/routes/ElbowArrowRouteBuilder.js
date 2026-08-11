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
var ElbowArrowRouteBuilder_exports = {};
__export(ElbowArrowRouteBuilder_exports, {
  ElbowArrowRouteBuilder: () => ElbowArrowRouteBuilder
});
module.exports = __toCommonJS(ElbowArrowRouteBuilder_exports);
var import_editor = require("@tldraw/editor");
const MIN_DISTANCE = 0.01;
class ElbowArrowRouteBuilder {
  constructor(info, name) {
    this.info = info;
    this.name = name;
  }
  points = [];
  add(x, y) {
    this.points.push(this.info.vec(x, y));
    return this;
  }
  _midpointHandle = null;
  midpointHandle(axis) {
    (0, import_editor.assert)(this._midpointHandle === null, "midX/midY called multiple times");
    const point = import_editor.Vec.Lrp(
      this.points[this.points.length - 2],
      this.points[this.points.length - 1],
      0.5
    );
    this._midpointHandle = {
      axis: this.info.transform.transpose ? axis === "x" ? "y" : "x" : axis,
      point,
      segmentStart: this.points[this.points.length - 2].clone(),
      segmentEnd: this.points[this.points.length - 1].clone()
    };
    return this;
  }
  build() {
    const finalPoints = [];
    for (let i = 0; i < this.points.length; i++) {
      const p0 = this.points[i];
      const p1 = finalPoints[finalPoints.length - 1];
      const p2 = finalPoints[finalPoints.length - 2];
      if (!p1 || !p2) {
        finalPoints.push(p0);
      } else {
        const d1x = Math.abs(p0.x - p1.x);
        const d1y = Math.abs(p0.y - p1.y);
        const d2x = Math.abs(p0.x - p2.x);
        const d2y = Math.abs(p0.y - p2.y);
        if (d1x < MIN_DISTANCE && d1y < MIN_DISTANCE) {
        } else if (d1x < MIN_DISTANCE && d2x < MIN_DISTANCE) {
          p1.y = p0.y;
        } else if (d1y < MIN_DISTANCE && d2y < MIN_DISTANCE) {
          p1.x = p0.x;
        } else {
          finalPoints.push(p0);
        }
      }
    }
    return {
      name: this.name,
      points: finalPoints,
      distance: measureRouteManhattanDistance(finalPoints),
      aEdgePicking: "manual",
      bEdgePicking: "manual",
      skipPointsWhenDrawing: /* @__PURE__ */ new Set(),
      midpointHandle: this._midpointHandle
    };
  }
}
function measureRouteManhattanDistance(path) {
  let distance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];
    distance += Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
  }
  return distance;
}
//# sourceMappingURL=ElbowArrowRouteBuilder.js.map
