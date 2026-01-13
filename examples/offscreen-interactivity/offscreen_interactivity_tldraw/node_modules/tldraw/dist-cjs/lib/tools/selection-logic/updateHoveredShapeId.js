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
var updateHoveredShapeId_exports = {};
__export(updateHoveredShapeId_exports, {
  updateHoveredShapeId: () => updateHoveredShapeId
});
module.exports = __toCommonJS(updateHoveredShapeId_exports);
var import_editor = require("@tldraw/editor");
function _updateHoveredShapeId(editor) {
  const hitShape = editor.getShapeAtPoint(editor.inputs.currentPagePoint, {
    hitInside: false,
    hitLabels: false,
    margin: editor.options.hitTestMargin / editor.getZoomLevel(),
    renderingOnly: true
  });
  if (!hitShape) return editor.setHoveredShape(null);
  let shapeToHover = void 0;
  const outermostShape = editor.getOutermostSelectableShape(hitShape);
  if (outermostShape === hitShape) {
    shapeToHover = hitShape;
  } else {
    if (outermostShape.id === editor.getFocusedGroupId() || editor.getSelectedShapeIds().includes(outermostShape.id)) {
      shapeToHover = hitShape;
    } else {
      shapeToHover = outermostShape;
    }
  }
  return editor.setHoveredShape(shapeToHover.id);
}
const updateHoveredShapeId = (0, import_editor.throttle)(
  _updateHoveredShapeId,
  process.env.NODE_ENV === "test" ? 0 : 32
);
//# sourceMappingURL=updateHoveredShapeId.js.map
