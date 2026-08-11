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
var defaultShapes_exports = {};
__export(defaultShapes_exports, {
  checkShapesAndAddCore: () => checkShapesAndAddCore,
  coreShapes: () => coreShapes
});
module.exports = __toCommonJS(defaultShapes_exports);
var import_GroupShapeUtil = require("../editor/shapes/group/GroupShapeUtil");
const coreShapes = [
  // created by grouping interactions, probably the corest core shape that we have
  import_GroupShapeUtil.GroupShapeUtil
];
const coreShapeTypes = new Set(coreShapes.map((s) => s.type));
function checkShapesAndAddCore(customShapes) {
  const shapes = [...coreShapes];
  const addedCustomShapeTypes = /* @__PURE__ */ new Set();
  for (const customShape of customShapes) {
    if (coreShapeTypes.has(customShape.type)) {
      throw new Error(
        `Shape type "${customShape.type}" is a core shapes type and cannot be overridden`
      );
    }
    if (addedCustomShapeTypes.has(customShape.type)) {
      throw new Error(`Shape type "${customShape.type}" is defined more than once`);
    }
    shapes.push(customShape);
    addedCustomShapeTypes.add(customShape.type);
  }
  return shapes;
}
//# sourceMappingURL=defaultShapes.js.map
