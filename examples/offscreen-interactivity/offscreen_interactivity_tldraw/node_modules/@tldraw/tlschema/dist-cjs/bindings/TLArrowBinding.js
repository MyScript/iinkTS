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
var TLArrowBinding_exports = {};
__export(TLArrowBinding_exports, {
  ElbowArrowSnap: () => ElbowArrowSnap,
  arrowBindingMigrations: () => arrowBindingMigrations,
  arrowBindingProps: () => arrowBindingProps,
  arrowBindingVersions: () => arrowBindingVersions
});
module.exports = __toCommonJS(TLArrowBinding_exports);
var import_validate = require("@tldraw/validate");
var import_geometry_types = require("../misc/geometry-types");
var import_TLBinding = require("../records/TLBinding");
var import_TLArrowShape = require("../shapes/TLArrowShape");
const ElbowArrowSnap = import_validate.T.literalEnum("center", "edge-point", "edge", "none");
const arrowBindingProps = {
  terminal: import_validate.T.literalEnum("start", "end"),
  normalizedAnchor: import_geometry_types.vecModelValidator,
  isExact: import_validate.T.boolean,
  isPrecise: import_validate.T.boolean,
  snap: ElbowArrowSnap
};
const arrowBindingVersions = (0, import_TLBinding.createBindingPropsMigrationIds)("arrow", {
  AddSnap: 1
});
const arrowBindingMigrations = (0, import_TLBinding.createBindingPropsMigrationSequence)({
  sequence: [
    { dependsOn: [import_TLArrowShape.arrowShapeVersions.ExtractBindings] },
    {
      id: arrowBindingVersions.AddSnap,
      up: (props) => {
        props.snap = "none";
      },
      down: (props) => {
        delete props.snap;
      }
    }
  ]
});
//# sourceMappingURL=TLArrowBinding.js.map
