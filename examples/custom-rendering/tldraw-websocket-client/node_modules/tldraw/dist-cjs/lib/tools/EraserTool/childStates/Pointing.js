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
var Pointing_exports = {};
__export(Pointing_exports, {
  Pointing: () => Pointing
});
module.exports = __toCommonJS(Pointing_exports);
var import_editor = require("@tldraw/editor");
class Pointing extends import_editor.StateNode {
  static id = "pointing";
  onEnter() {
    const zoomLevel = this.editor.getZoomLevel();
    const currentPageShapesSorted = this.editor.getCurrentPageRenderingShapesSorted();
    const {
      inputs: { currentPagePoint }
    } = this.editor;
    const erasing = /* @__PURE__ */ new Set();
    const initialSize = erasing.size;
    for (let n = currentPageShapesSorted.length, i = n - 1; i >= 0; i--) {
      const shape = currentPageShapesSorted[i];
      if (this.editor.isShapeOrAncestorLocked(shape) || this.editor.isShapeOfType(shape, "group")) {
        continue;
      }
      if (this.editor.isPointInShape(shape, currentPagePoint, {
        hitInside: false,
        margin: this.editor.options.hitTestMargin / zoomLevel
      })) {
        const hitShape = this.editor.getOutermostSelectableShape(shape);
        if (this.editor.isShapeOfType(hitShape, "frame") && erasing.size > initialSize) {
          break;
        }
        erasing.add(hitShape.id);
      }
    }
    this.editor.setErasingShapes([...erasing]);
  }
  onLongPress(info) {
    this.startErasing(info);
  }
  onExit(_info, to) {
    if (to !== "erasing") {
      this.editor.setErasingShapes([]);
    }
  }
  onPointerMove(info) {
    if (this.editor.inputs.isDragging) {
      this.startErasing(info);
    }
  }
  onPointerUp() {
    this.complete();
  }
  onCancel() {
    this.cancel();
  }
  onComplete() {
    this.complete();
  }
  onInterrupt() {
    this.cancel();
  }
  startErasing(info) {
    this.parent.transition("erasing", info);
  }
  complete() {
    const erasingShapeIds = this.editor.getErasingShapeIds();
    if (erasingShapeIds.length) {
      this.editor.markHistoryStoppingPoint("erase end");
      this.editor.deleteShapes(erasingShapeIds);
    }
    this.parent.transition("idle");
  }
  cancel() {
    this.parent.transition("idle");
  }
}
//# sourceMappingURL=Pointing.js.map
