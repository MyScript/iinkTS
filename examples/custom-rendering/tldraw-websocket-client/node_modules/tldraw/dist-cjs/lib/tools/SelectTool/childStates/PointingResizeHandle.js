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
var PointingResizeHandle_exports = {};
__export(PointingResizeHandle_exports, {
  CursorTypeMap: () => CursorTypeMap,
  PointingResizeHandle: () => PointingResizeHandle
});
module.exports = __toCommonJS(PointingResizeHandle_exports);
var import_editor = require("@tldraw/editor");
const CursorTypeMap = {
  bottom: "ns-resize",
  top: "ns-resize",
  left: "ew-resize",
  right: "ew-resize",
  bottom_left: "nesw-resize",
  bottom_right: "nwse-resize",
  top_left: "nwse-resize",
  top_right: "nesw-resize",
  bottom_left_rotate: "swne-rotate",
  bottom_right_rotate: "senw-rotate",
  top_left_rotate: "nwse-rotate",
  top_right_rotate: "nesw-rotate",
  mobile_rotate: "grabbing"
};
class PointingResizeHandle extends import_editor.StateNode {
  static id = "pointing_resize_handle";
  info = {};
  updateCursor() {
    const selected = this.editor.getSelectedShapes();
    const cursorType = CursorTypeMap[this.info.handle];
    this.editor.setCursor({
      type: cursorType,
      rotation: selected.length === 1 ? this.editor.getSelectionRotation() : 0
    });
  }
  onEnter(info) {
    this.info = info;
    this.updateCursor();
  }
  onPointerMove() {
    if (this.editor.inputs.isDragging) {
      this.startResizing();
    }
  }
  onLongPress() {
    this.startResizing();
  }
  startResizing() {
    if (this.editor.getIsReadonly()) return;
    this.parent.transition("resizing", this.info);
  }
  onPointerUp() {
    this.complete();
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
  complete() {
    if (this.info.onInteractionEnd) {
      this.editor.setCurrentTool(this.info.onInteractionEnd, {});
    } else {
      this.parent.transition("idle");
    }
  }
  cancel() {
    if (this.info.onInteractionEnd) {
      this.editor.setCurrentTool(this.info.onInteractionEnd, {});
    } else {
      this.parent.transition("idle");
    }
  }
}
//# sourceMappingURL=PointingResizeHandle.js.map
