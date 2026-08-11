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
var svg_exports = {};
__export(svg_exports, {
  getSvgPathFromStrokePoints: () => getSvgPathFromStrokePoints
});
module.exports = __toCommonJS(svg_exports);
var import_editor = require("@tldraw/editor");
function getSvgPathFromStrokePoints(points, closed = false) {
  const len = points.length;
  if (len < 2) {
    return "";
  }
  let a = points[0].point;
  let b = points[1].point;
  if (len === 2) {
    return `M${(0, import_editor.precise)(a)}L${(0, import_editor.precise)(b)}`;
  }
  let result = "";
  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i].point;
    b = points[i + 1].point;
    result += (0, import_editor.average)(a, b);
  }
  if (closed) {
    return `M${(0, import_editor.average)(points[0].point, points[1].point)}Q${(0, import_editor.precise)(points[1].point)}${(0, import_editor.average)(
      points[1].point,
      points[2].point
    )}T${result}${(0, import_editor.average)(points[len - 1].point, points[0].point)}${(0, import_editor.average)(
      points[0].point,
      points[1].point
    )}Z`;
  } else {
    return `M${(0, import_editor.precise)(points[0].point)}Q${(0, import_editor.precise)(points[1].point)}${(0, import_editor.average)(
      points[1].point,
      points[2].point
    )}${points.length > 3 ? "T" : ""}${result}L${(0, import_editor.precise)(points[len - 1].point)}`;
  }
}
//# sourceMappingURL=svg.js.map
