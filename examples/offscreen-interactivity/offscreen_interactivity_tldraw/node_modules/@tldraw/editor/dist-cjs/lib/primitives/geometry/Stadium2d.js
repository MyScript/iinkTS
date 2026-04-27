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
var Stadium2d_exports = {};
__export(Stadium2d_exports, {
  Stadium2d: () => Stadium2d
});
module.exports = __toCommonJS(Stadium2d_exports);
var import_Box = require("../Box");
var import_Vec = require("../Vec");
var import_utils = require("../utils");
var import_Arc2d = require("./Arc2d");
var import_Edge2d = require("./Edge2d");
var import_Geometry2d = require("./Geometry2d");
class Stadium2d extends import_Geometry2d.Geometry2d {
  constructor(config) {
    super({ ...config, isClosed: true });
    this.config = config;
    const { width: w, height: h } = config;
    this._w = w;
    this._h = h;
    if (h > w) {
      const r = w / 2;
      this._a = new import_Arc2d.Arc2d({
        start: new import_Vec.Vec(0, r),
        end: new import_Vec.Vec(w, r),
        center: new import_Vec.Vec(w / 2, r),
        sweepFlag: 1,
        largeArcFlag: 1
      });
      this._b = new import_Edge2d.Edge2d({ start: new import_Vec.Vec(w, r), end: new import_Vec.Vec(w, h - r) });
      this._c = new import_Arc2d.Arc2d({
        start: new import_Vec.Vec(w, h - r),
        end: new import_Vec.Vec(0, h - r),
        center: new import_Vec.Vec(w / 2, h - r),
        sweepFlag: 1,
        largeArcFlag: 1
      });
      this._d = new import_Edge2d.Edge2d({ start: new import_Vec.Vec(0, h - r), end: new import_Vec.Vec(0, r) });
    } else {
      const r = h / 2;
      this._a = new import_Arc2d.Arc2d({
        start: new import_Vec.Vec(r, h),
        end: new import_Vec.Vec(r, 0),
        center: new import_Vec.Vec(r, r),
        sweepFlag: 1,
        largeArcFlag: 1
      });
      this._b = new import_Edge2d.Edge2d({ start: new import_Vec.Vec(r, 0), end: new import_Vec.Vec(w - r, 0) });
      this._c = new import_Arc2d.Arc2d({
        start: new import_Vec.Vec(w - r, 0),
        end: new import_Vec.Vec(w - r, h),
        center: new import_Vec.Vec(w - r, r),
        sweepFlag: 1,
        largeArcFlag: 1
      });
      this._d = new import_Edge2d.Edge2d({ start: new import_Vec.Vec(w - r, h), end: new import_Vec.Vec(r, h) });
    }
  }
  _w;
  _h;
  _a;
  _b;
  _c;
  _d;
  nearestPoint(A) {
    let nearest;
    let dist = Infinity;
    let _d;
    let p;
    const { _a: a, _b: b, _c: c, _d: d } = this;
    for (const part of [a, b, c, d]) {
      p = part.nearestPoint(A);
      _d = import_Vec.Vec.Dist2(p, A);
      if (_d < dist) {
        nearest = p;
        dist = _d;
      }
    }
    if (!nearest) throw Error("nearest point not found");
    return nearest;
  }
  hitTestLineSegment(A, B) {
    const { _a: a, _b: b, _c: c, _d: d } = this;
    return [a, b, c, d].some((edge) => edge.hitTestLineSegment(A, B));
  }
  getVertices() {
    const { _a: a, _b: b, _c: c, _d: d } = this;
    return [a, b, c, d].reduce((a2, p) => {
      a2.push(...p.vertices);
      return a2;
    }, []);
  }
  getBounds() {
    return new import_Box.Box(0, 0, this._w, this._h);
  }
  getLength() {
    const { _h: h, _w: w } = this;
    if (h > w) return (import_utils.PI * (w / 2) + (h - w)) * 2;
    else return (import_utils.PI * (h / 2) + (w - h)) * 2;
  }
  getSvgPathData() {
    const { _a: a, _b: b, _c: c, _d: d } = this;
    return [a, b, c, d].map((p, i) => p.getSvgPathData(i === 0)).join(" ") + " Z";
  }
}
//# sourceMappingURL=Stadium2d.js.map
