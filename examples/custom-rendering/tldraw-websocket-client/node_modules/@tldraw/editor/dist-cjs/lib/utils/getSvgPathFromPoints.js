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
var getSvgPathFromPoints_exports = {};
__export(getSvgPathFromPoints_exports, {
  getSvgPathFromPoints: () => getSvgPathFromPoints
});
module.exports = __toCommonJS(getSvgPathFromPoints_exports);
var import_utils = require("../primitives/utils");
function getSvgPathFromPoints(points, closed = true) {
  const len = points.length;
  if (len < 2) {
    return "";
  }
  let a = points[0];
  let b = points[1];
  if (len === 2) {
    return `M${(0, import_utils.precise)(a)}L${(0, import_utils.precise)(b)}`;
  }
  let result = "";
  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += (0, import_utils.average)(a, b);
  }
  if (closed) {
    return `M${(0, import_utils.average)(points[0], points[1])}Q${(0, import_utils.precise)(points[1])}${(0, import_utils.average)(
      points[1],
      points[2]
    )}T${result}${(0, import_utils.average)(points[len - 1], points[0])}${(0, import_utils.average)(points[0], points[1])}Z`;
  } else {
    return `M${(0, import_utils.precise)(points[0])}Q${(0, import_utils.precise)(points[1])}${(0, import_utils.average)(points[1], points[2])}${points.length > 3 ? "T" : ""}${result}L${(0, import_utils.precise)(points[len - 1])}`;
  }
}
//# sourceMappingURL=getSvgPathFromPoints.js.map
