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
var geometry_constants_exports = {};
__export(geometry_constants_exports, {
  getVerticesCountForArcLength: () => getVerticesCountForArcLength
});
module.exports = __toCommonJS(geometry_constants_exports);
const SPACING = 20;
const MIN_COUNT = 8;
function getVerticesCountForArcLength(length, spacing = SPACING) {
  return Math.max(MIN_COUNT, Math.ceil(length / spacing));
}
//# sourceMappingURL=geometry-constants.js.map
