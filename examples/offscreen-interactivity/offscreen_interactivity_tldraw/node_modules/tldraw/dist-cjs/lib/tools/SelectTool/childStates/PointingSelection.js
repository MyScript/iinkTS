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
var PointingSelection_exports = {};
__export(PointingSelection_exports, {
  PointingSelection: () => PointingSelection
});
module.exports = __toCommonJS(PointingSelection_exports);
var import_editor = require("@tldraw/editor");
var import_selectOnCanvasPointerUp = require("../../selection-logic/selectOnCanvasPointerUp");
class PointingSelection extends import_editor.StateNode {
  static id = "pointing_selection";
  info = {};
  onEnter(info) {
    this.info = info;
  }
  onPointerUp(info) {
    (0, import_selectOnCanvasPointerUp.selectOnCanvasPointerUp)(this.editor, info);
    this.parent.transition("idle", info);
  }
  onPointerMove(info) {
    if (this.editor.inputs.isDragging) {
      this.startTranslating(info);
    }
  }
  onLongPress(info) {
    this.startTranslating(info);
  }
  startTranslating(info) {
    if (this.editor.getIsReadonly()) return;
    this.parent.transition("translating", info);
  }
  onDoubleClick(info) {
    const hoveredShape = this.editor.getHoveredShape();
    const hitShape = hoveredShape && !this.editor.isShapeOfType(hoveredShape, "group") ? hoveredShape : this.editor.getShapeAtPoint(this.editor.inputs.currentPagePoint, {
      hitInside: true,
      margin: 0,
      renderingOnly: true
    });
    if (hitShape) {
      this.parent.transition("idle");
      this.parent.onDoubleClick?.({
        ...info,
        target: "shape",
        shape: this.editor.getShape(hitShape)
      });
      return;
    }
  }
  onCancel() {
    this.cancel();
  }
  onComplete() {
    this.cancel();
  }
  onInterrupt() {
    this.cancel();
  }
  cancel() {
    this.parent.transition("idle");
  }
}
//# sourceMappingURL=PointingSelection.js.map
