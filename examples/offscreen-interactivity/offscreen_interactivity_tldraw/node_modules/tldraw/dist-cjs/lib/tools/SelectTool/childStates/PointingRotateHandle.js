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
var PointingRotateHandle_exports = {};
__export(PointingRotateHandle_exports, {
  PointingRotateHandle: () => PointingRotateHandle
});
module.exports = __toCommonJS(PointingRotateHandle_exports);
var import_editor = require("@tldraw/editor");
var import_PointingResizeHandle = require("./PointingResizeHandle");
class PointingRotateHandle extends import_editor.StateNode {
  static id = "pointing_rotate_handle";
  info = {};
  updateCursor() {
    this.editor.setCursor({
      type: import_PointingResizeHandle.CursorTypeMap[this.info.handle],
      rotation: this.editor.getSelectionRotation()
    });
  }
  onEnter(info) {
    this.parent.setCurrentToolIdMask(info.onInteractionEnd);
    this.info = info;
    this.updateCursor();
  }
  onExit() {
    this.parent.setCurrentToolIdMask(void 0);
    this.editor.setCursor({ type: "default", rotation: 0 });
  }
  onPointerMove() {
    if (this.editor.inputs.isDragging) {
      this.startRotating();
    }
  }
  onLongPress() {
    this.startRotating();
  }
  startRotating() {
    if (this.editor.getIsReadonly()) return;
    this.parent.transition("rotating", this.info);
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
//# sourceMappingURL=PointingRotateHandle.js.map
