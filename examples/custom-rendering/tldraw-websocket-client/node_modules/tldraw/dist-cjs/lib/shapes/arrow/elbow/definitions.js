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
var definitions_exports = {};
__export(definitions_exports, {
  ElbowArrowAxes: () => ElbowArrowAxes,
  ElbowArrowSideAxes: () => ElbowArrowSideAxes,
  ElbowArrowSideDeltas: () => ElbowArrowSideDeltas,
  ElbowArrowSideOpposites: () => ElbowArrowSideOpposites,
  ElbowArrowSides: () => ElbowArrowSides
});
module.exports = __toCommonJS(definitions_exports);
var import_editor = require("@tldraw/editor");
const ElbowArrowSides = ["right", "bottom", "left", "top"];
const ElbowArrowSideDeltas = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 }
};
const ElbowArrowSideAxes = {
  left: "x",
  right: "x",
  top: "y",
  bottom: "y"
};
const ElbowArrowSideOpposites = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right"
};
const ElbowArrowAxes = {
  x: {
    v: (x, y) => new import_editor.Vec(x, y),
    loEdge: "left",
    hiEdge: "right",
    crossMid: "midY",
    gap: "gapX",
    midRange: "midXRange",
    self: "x",
    cross: "y",
    size: "width"
  },
  y: {
    v: (y, x) => new import_editor.Vec(x, y),
    loEdge: "top",
    hiEdge: "bottom",
    crossMid: "midX",
    gap: "gapY",
    midRange: "midYRange",
    self: "y",
    cross: "x",
    size: "height"
  }
};
//# sourceMappingURL=definitions.js.map
