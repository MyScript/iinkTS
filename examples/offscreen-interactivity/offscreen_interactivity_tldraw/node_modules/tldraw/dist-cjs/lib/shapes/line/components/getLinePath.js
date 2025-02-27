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
var getLinePath_exports = {};
__export(getLinePath_exports, {
  getLineDrawPath: () => getLineDrawPath,
  getLineIndicatorPath: () => getLineIndicatorPath
});
module.exports = __toCommonJS(getLinePath_exports);
var import_editor = require("@tldraw/editor");
var import_getStrokeOutlinePoints = require("../../shared/freehand/getStrokeOutlinePoints");
var import_getStrokePoints = require("../../shared/freehand/getStrokePoints");
var import_setStrokePointRadii = require("../../shared/freehand/setStrokePointRadii");
var import_svg = require("../../shared/freehand/svg");
function getLineDrawFreehandOptions(strokeWidth) {
  return {
    size: strokeWidth,
    thinning: 0.4,
    streamline: 0,
    smoothing: 0.5,
    simulatePressure: true,
    last: true
  };
}
function getLineStrokePoints(shape, spline, strokeWidth) {
  const points = spline.vertices;
  const options = getLineDrawFreehandOptions(strokeWidth);
  return (0, import_getStrokePoints.getStrokePoints)(points, options);
}
function getLineDrawStrokeOutlinePoints(shape, spline, strokeWidth) {
  const options = getLineDrawFreehandOptions(strokeWidth);
  return (0, import_getStrokeOutlinePoints.getStrokeOutlinePoints)(
    (0, import_setStrokePointRadii.setStrokePointRadii)(getLineStrokePoints(shape, spline, strokeWidth), options),
    options
  );
}
function getLineDrawPath(shape, spline, strokeWidth) {
  const stroke = getLineDrawStrokeOutlinePoints(shape, spline, strokeWidth);
  return (0, import_editor.getSvgPathFromPoints)(stroke);
}
function getLineIndicatorPath(shape, spline, strokeWidth) {
  if (shape.props.dash === "draw") {
    const strokePoints = getLineStrokePoints(shape, spline, strokeWidth);
    return (0, import_svg.getSvgPathFromStrokePoints)(strokePoints);
  }
  return spline.getSvgPathData();
}
//# sourceMappingURL=getLinePath.js.map
