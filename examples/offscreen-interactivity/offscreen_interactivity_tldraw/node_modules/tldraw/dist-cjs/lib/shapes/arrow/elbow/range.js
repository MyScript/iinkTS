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
var range_exports = {};
__export(range_exports, {
  clampToRange: () => clampToRange,
  createRange: () => createRange,
  doRangesOverlap: () => doRangesOverlap,
  expandRange: () => expandRange,
  isWithinRange: () => isWithinRange,
  rangeCenter: () => rangeCenter,
  rangeSize: () => rangeSize,
  subtractRange: () => subtractRange
});
module.exports = __toCommonJS(range_exports);
var import_editor = require("@tldraw/editor");
function expandRange(range, amount) {
  const newRange = {
    min: range.min - amount,
    max: range.max + amount
  };
  if (newRange.min > newRange.max) {
    return null;
  }
  return newRange;
}
function clampToRange(value, range) {
  return (0, import_editor.clamp)(value, range.min, range.max);
}
function subtractRange(a, b) {
  (0, import_editor.assert)(a.min <= a.max && b.min <= b.max);
  if (a.min <= b.min && b.max <= a.max) {
    return [
      { min: a.min, max: b.min },
      { min: b.max, max: a.max }
    ];
  }
  if (b.max <= a.min || b.min >= a.max) {
    return [a];
  }
  if (b.min <= a.min && a.max <= b.max) {
    return [];
  }
  if (isWithinRange(a.min, b)) {
    return [{ min: b.max, max: a.max }];
  }
  if (isWithinRange(a.max, b)) {
    return [{ min: a.min, max: b.min }];
  }
  return [];
}
function createRange(a, b) {
  return { min: Math.min(a, b), max: Math.max(a, b) };
}
function doRangesOverlap(a, b) {
  return a.min <= b.max && a.max >= b.min;
}
function isWithinRange(value, range) {
  return value >= range.min && value <= range.max;
}
function rangeSize(range) {
  return range.max - range.min;
}
function rangeCenter(range) {
  return (range.min + range.max) / 2;
}
//# sourceMappingURL=range.js.map
