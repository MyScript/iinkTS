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
var Edge2d_exports = {};
__export(Edge2d_exports, {
  Edge2d: () => Edge2d
});
module.exports = __toCommonJS(Edge2d_exports);
var import_Vec = require("../Vec");
var import_Geometry2d = require("./Geometry2d");
class Edge2d extends import_Geometry2d.Geometry2d {
  _start;
  _end;
  _d;
  _u;
  _ul;
  constructor(config) {
    super({ ...config, isClosed: false, isFilled: false });
    const { start, end } = config;
    this._start = start;
    this._end = end;
    this._d = start.clone().sub(end);
    this._u = this._d.clone().uni();
    this._ul = this._u.len();
  }
  getLength() {
    return this._d.len();
  }
  getVertices() {
    return [this._start, this._end];
  }
  nearestPoint(point) {
    const { _start: start, _end: end, _d: d, _u: u, _ul: l } = this;
    if (d.len() === 0) return start;
    if (l === 0) return start;
    const k = import_Vec.Vec.Sub(point, start).dpr(u) / l;
    const cx = start.x + u.x * k;
    if (cx < Math.min(start.x, end.x)) return start.x < end.x ? start : end;
    if (cx > Math.max(start.x, end.x)) return start.x > end.x ? start : end;
    const cy = start.y + u.y * k;
    if (cy < Math.min(start.y, end.y)) return start.y < end.y ? start : end;
    if (cy > Math.max(start.y, end.y)) return start.y > end.y ? start : end;
    return new import_Vec.Vec(cx, cy);
  }
  getSvgPathData(first = true) {
    const { _start: start, _end: end } = this;
    return `${first ? `M${start.toFixed()}` : ``} L${end.toFixed()}`;
  }
}
//# sourceMappingURL=Edge2d.js.map
