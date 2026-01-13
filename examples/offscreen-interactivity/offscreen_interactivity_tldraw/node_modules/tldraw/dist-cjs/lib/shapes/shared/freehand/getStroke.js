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
var getStroke_exports = {};
__export(getStroke_exports, {
  getStroke: () => getStroke
});
module.exports = __toCommonJS(getStroke_exports);
var import_getStrokeOutlinePoints = require("./getStrokeOutlinePoints");
var import_getStrokePoints = require("./getStrokePoints");
var import_setStrokePointRadii = require("./setStrokePointRadii");
function getStroke(points, options = {}) {
  return (0, import_getStrokeOutlinePoints.getStrokeOutlinePoints)(
    (0, import_setStrokePointRadii.setStrokePointRadii)((0, import_getStrokePoints.getStrokePoints)(points, options), options),
    options
  );
}
//# sourceMappingURL=getStroke.js.map
