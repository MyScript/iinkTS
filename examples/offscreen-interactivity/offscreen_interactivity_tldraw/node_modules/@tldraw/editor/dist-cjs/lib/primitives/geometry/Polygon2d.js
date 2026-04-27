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
var Polygon2d_exports = {};
__export(Polygon2d_exports, {
  Polygon2d: () => Polygon2d
});
module.exports = __toCommonJS(Polygon2d_exports);
var import_Polyline2d = require("./Polyline2d");
class Polygon2d extends import_Polyline2d.Polyline2d {
  constructor(config) {
    super({ ...config });
    this.isClosed = true;
    if (config.points.length < 3) {
      throw new Error("Polygon2d: points must be an array of at least 3 points");
    }
  }
}
//# sourceMappingURL=Polygon2d.js.map
