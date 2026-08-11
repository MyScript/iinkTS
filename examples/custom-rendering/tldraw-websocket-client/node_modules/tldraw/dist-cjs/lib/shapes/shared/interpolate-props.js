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
var interpolate_props_exports = {};
__export(interpolate_props_exports, {
  interpolateSegments: () => interpolateSegments
});
module.exports = __toCommonJS(interpolate_props_exports);
var import_editor = require("@tldraw/editor");
const interpolateSegments = (startSegments, endSegments, progress) => {
  const startPoints = [];
  const endPoints = [];
  startSegments.forEach((segment) => startPoints.push(...segment.points));
  endSegments.forEach((segment) => endPoints.push(...segment.points));
  const maxLength = Math.max(startPoints.length, endPoints.length);
  const pointsToUseStart = [];
  const pointsToUseEnd = [];
  for (let i = 0; i < maxLength; i++) {
    pointsToUseStart.push(startPoints[i] || startPoints[startPoints.length - 1]);
    pointsToUseEnd.push(endPoints[i] || endPoints[endPoints.length - 1]);
  }
  const interpolatedPoints = pointsToUseStart.map((point, k) => {
    let z = 0.5;
    if (pointsToUseEnd[k].z !== void 0 && point.z !== void 0) {
      z = (0, import_editor.lerp)(point.z, pointsToUseEnd[k].z, progress);
    }
    return {
      x: (0, import_editor.lerp)(point.x, pointsToUseEnd[k].x, progress),
      y: (0, import_editor.lerp)(point.y, pointsToUseEnd[k].y, progress),
      z
    };
  });
  return [
    {
      type: "free",
      points: interpolatedPoints
    }
  ];
};
//# sourceMappingURL=interpolate-props.js.map
