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
var Arc2d_exports = {};
__export(Arc2d_exports, {
  Arc2d: () => Arc2d
});
module.exports = __toCommonJS(Arc2d_exports);
var import_Vec = require("../Vec");
var import_intersect = require("../intersect");
var import_utils = require("../utils");
var import_Geometry2d = require("./Geometry2d");
var import_geometry_constants = require("./geometry-constants");
class Arc2d extends import_Geometry2d.Geometry2d {
  _center;
  _radius;
  _start;
  _end;
  _largeArcFlag;
  _sweepFlag;
  _measure;
  _angleStart;
  _angleEnd;
  constructor(config) {
    super({ ...config, isFilled: false, isClosed: false });
    const { center, sweepFlag, largeArcFlag, start, end } = config;
    if (start.equals(end)) throw Error(`Arc must have different start and end points.`);
    this._angleStart = import_Vec.Vec.Angle(center, start);
    this._angleEnd = import_Vec.Vec.Angle(center, end);
    this._radius = import_Vec.Vec.Dist(center, start);
    this._measure = (0, import_utils.getArcMeasure)(this._angleStart, this._angleEnd, sweepFlag, largeArcFlag);
    this._start = start;
    this._end = end;
    this._sweepFlag = sweepFlag;
    this._largeArcFlag = largeArcFlag;
    this._center = center;
  }
  nearestPoint(point) {
    const {
      _center,
      _measure: measure,
      _radius: radius,
      _angleEnd: angleEnd,
      _angleStart: angleStart,
      _start: A,
      _end: B
    } = this;
    const t = (0, import_utils.getPointInArcT)(measure, angleStart, angleEnd, _center.angle(point));
    if (t <= 0) return A;
    if (t >= 1) return B;
    const P = import_Vec.Vec.Sub(point, _center).uni().mul(radius).add(_center);
    let nearest;
    let dist = Infinity;
    let d;
    for (const p of [A, B, P]) {
      d = import_Vec.Vec.Dist2(point, p);
      if (d < dist) {
        nearest = p;
        dist = d;
      }
    }
    if (!nearest) throw Error("nearest point not found");
    return nearest;
  }
  hitTestLineSegment(A, B) {
    const {
      _center,
      _radius: radius,
      _measure: measure,
      _angleStart: angleStart,
      _angleEnd: angleEnd
    } = this;
    const intersection = (0, import_intersect.intersectLineSegmentCircle)(A, B, _center, radius);
    if (intersection === null) return false;
    return intersection.some((p) => {
      const result = (0, import_utils.getPointInArcT)(measure, angleStart, angleEnd, _center.angle(p));
      return result >= 0 && result <= 1;
    });
  }
  getVertices() {
    const { _center, _measure: measure, length, _radius: radius, _angleStart: angleStart } = this;
    const vertices = [];
    for (let i = 0, n = (0, import_geometry_constants.getVerticesCountForArcLength)(Math.abs(length)); i < n + 1; i++) {
      const t = i / n * measure;
      const angle = angleStart + t;
      vertices.push((0, import_utils.getPointOnCircle)(_center, radius, angle));
    }
    return vertices;
  }
  getSvgPathData(first = true) {
    const {
      _start: start,
      _end: end,
      _radius: radius,
      _largeArcFlag: largeArcFlag,
      _sweepFlag: sweepFlag
    } = this;
    return `${first ? `M${start.toFixed()}` : ``} A${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.toFixed()}`;
  }
  getLength() {
    return Math.abs(this._measure * this._radius);
  }
}
//# sourceMappingURL=Arc2d.js.map
