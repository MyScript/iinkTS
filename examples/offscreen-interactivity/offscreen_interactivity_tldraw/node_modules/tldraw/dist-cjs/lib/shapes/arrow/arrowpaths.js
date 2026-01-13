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
var arrowpaths_exports = {};
__export(arrowpaths_exports, {
  getCurvedArrowHandlePath: () => getCurvedArrowHandlePath,
  getSolidCurvedArrowPath: () => getSolidCurvedArrowPath,
  getSolidStraightArrowPath: () => getSolidStraightArrowPath,
  getStraightArrowHandlePath: () => getStraightArrowHandlePath
});
module.exports = __toCommonJS(arrowpaths_exports);
function getCurvedArrowHandlePath(info) {
  const {
    start,
    end,
    handleArc: { radius, largeArcFlag, sweepFlag }
  } = info;
  return `M${start.handle.x},${start.handle.y} A${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.handle.x},${end.handle.y}`;
}
function getSolidCurvedArrowPath(info) {
  const {
    start,
    end,
    bodyArc: { radius, largeArcFlag, sweepFlag }
  } = info;
  return `M${start.point.x},${start.point.y} A${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.point.x},${end.point.y}`;
}
function getArrowPath(start, end) {
  return `M${start.x},${start.y}L${end.x},${end.y}`;
}
function getStraightArrowHandlePath(info) {
  return getArrowPath(info.start.handle, info.end.handle);
}
function getSolidStraightArrowPath(info) {
  return getArrowPath(info.start.point, info.end.point);
}
//# sourceMappingURL=arrowpaths.js.map
