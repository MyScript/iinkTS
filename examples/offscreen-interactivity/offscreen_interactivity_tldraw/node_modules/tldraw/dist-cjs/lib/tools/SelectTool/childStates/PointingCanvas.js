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
var PointingCanvas_exports = {};
__export(PointingCanvas_exports, {
  PointingCanvas: () => PointingCanvas
});
module.exports = __toCommonJS(PointingCanvas_exports);
var import_editor = require("@tldraw/editor");
var import_selectOnCanvasPointerUp = require("../../selection-logic/selectOnCanvasPointerUp");
class PointingCanvas extends import_editor.StateNode {
  static id = "pointing_canvas";
  onEnter(info) {
    const additiveSelectionKey = info.shiftKey || info.accelKey;
    if (!additiveSelectionKey) {
      if (this.editor.getSelectedShapeIds().length > 0) {
        this.editor.markHistoryStoppingPoint("selecting none");
        this.editor.selectNone();
      }
    }
  }
  onPointerMove(info) {
    if (this.editor.inputs.isDragging) {
      this.parent.transition("brushing", info);
    }
  }
  onPointerUp(info) {
    (0, import_selectOnCanvasPointerUp.selectOnCanvasPointerUp)(this.editor, info);
    this.complete();
  }
  onComplete() {
    this.complete();
  }
  onInterrupt() {
    this.parent.transition("idle");
  }
  complete() {
    this.parent.transition("idle");
  }
}
//# sourceMappingURL=PointingCanvas.js.map
