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
var TLFrameShape_exports = {};
__export(TLFrameShape_exports, {
  frameShapeMigrations: () => frameShapeMigrations,
  frameShapeProps: () => frameShapeProps,
  frameShapeVersions: () => Versions
});
module.exports = __toCommonJS(TLFrameShape_exports);
var import_validate = require("@tldraw/validate");
var import_TLShape = require("../records/TLShape");
var import_TLColorStyle = require("../styles/TLColorStyle");
const frameShapeProps = {
  w: import_validate.T.nonZeroNumber,
  h: import_validate.T.nonZeroNumber,
  name: import_validate.T.string,
  // because shape colors are an option, we don't want them to be picked up by the editor as a
  // style prop by default, so instead of a proper style we just supply an equivalent validator.
  // Check `FrameShapeUtil.configure` for how we replace this with the original
  // `DefaultColorStyle` style when the option is turned on.
  color: import_validate.T.literalEnum(...import_TLColorStyle.DefaultColorStyle.values)
};
const Versions = (0, import_TLShape.createShapePropsMigrationIds)("frame", {
  AddColorProp: 1
});
const frameShapeMigrations = (0, import_TLShape.createShapePropsMigrationSequence)({
  sequence: [
    {
      id: Versions.AddColorProp,
      up: (props) => {
        props.color = "black";
      },
      down: (props) => {
        delete props.color;
      }
    }
  ]
});
//# sourceMappingURL=TLFrameShape.js.map
