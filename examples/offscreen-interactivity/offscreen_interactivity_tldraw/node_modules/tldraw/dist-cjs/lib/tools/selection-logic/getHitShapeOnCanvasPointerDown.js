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
var getHitShapeOnCanvasPointerDown_exports = {};
__export(getHitShapeOnCanvasPointerDown_exports, {
  getHitShapeOnCanvasPointerDown: () => getHitShapeOnCanvasPointerDown
});
module.exports = __toCommonJS(getHitShapeOnCanvasPointerDown_exports);
function getHitShapeOnCanvasPointerDown(editor, hitLabels = false) {
  const zoomLevel = editor.getZoomLevel();
  const {
    inputs: { currentPagePoint }
  } = editor;
  return (
    // hovered shape at point
    editor.getShapeAtPoint(currentPagePoint, {
      hitInside: false,
      hitLabels,
      margin: editor.options.hitTestMargin / zoomLevel,
      renderingOnly: true
    }) ?? // selected shape at point
    editor.getSelectedShapeAtPoint(currentPagePoint)
  );
}
//# sourceMappingURL=getHitShapeOnCanvasPointerDown.js.map
