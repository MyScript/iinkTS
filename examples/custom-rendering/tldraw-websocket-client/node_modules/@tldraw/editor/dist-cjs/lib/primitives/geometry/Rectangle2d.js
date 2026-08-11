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
var Rectangle2d_exports = {};
__export(Rectangle2d_exports, {
  Rectangle2d: () => Rectangle2d
});
module.exports = __toCommonJS(Rectangle2d_exports);
var import_Box = require("../Box");
var import_Vec = require("../Vec");
var import_Polygon2d = require("./Polygon2d");
class Rectangle2d extends import_Polygon2d.Polygon2d {
  _x;
  _y;
  _w;
  _h;
  constructor(config) {
    const { x = 0, y = 0, width, height } = config;
    super({
      ...config,
      points: [
        new import_Vec.Vec(x, y),
        new import_Vec.Vec(x + width, y),
        new import_Vec.Vec(x + width, y + height),
        new import_Vec.Vec(x, y + height)
      ]
    });
    this._x = x;
    this._y = y;
    this._w = width;
    this._h = height;
  }
  getBounds() {
    return new import_Box.Box(this._x, this._y, this._w, this._h);
  }
  getSvgPathData() {
    const { _x: x, _y: y, _w: w, _h: h } = this;
    this.negativeZeroFix();
    return `M${x},${y} h${w} v${h} h${-w}z`;
  }
  negativeZeroFix() {
    this._x = zeroFix(this._x);
    this._y = zeroFix(this._y);
    this._w = zeroFix(this._w);
    this._h = zeroFix(this._h);
  }
}
function zeroFix(value) {
  if (Object.is(value, -0)) return 0;
  return value;
}
//# sourceMappingURL=Rectangle2d.js.map
