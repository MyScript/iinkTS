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
var HandTool_exports = {};
__export(HandTool_exports, {
  HandTool: () => HandTool
});
module.exports = __toCommonJS(HandTool_exports);
var import_editor = require("@tldraw/editor");
var import_Dragging = require("./childStates/Dragging");
var import_Idle = require("./childStates/Idle");
var import_Pointing = require("./childStates/Pointing");
class HandTool extends import_editor.StateNode {
  static id = "hand";
  static initial = "idle";
  static isLockable = false;
  static children() {
    return [import_Idle.Idle, import_Pointing.Pointing, import_Dragging.Dragging];
  }
  onDoubleClick(info) {
    if (info.phase === "settle") {
      const { currentScreenPoint } = this.editor.inputs;
      this.editor.zoomIn(currentScreenPoint, {
        animation: { duration: 220, easing: import_editor.EASINGS.easeOutQuint }
      });
    }
  }
  onTripleClick(info) {
    if (info.phase === "settle") {
      const { currentScreenPoint } = this.editor.inputs;
      this.editor.zoomOut(currentScreenPoint, {
        animation: { duration: 320, easing: import_editor.EASINGS.easeOutQuint }
      });
    }
  }
  onQuadrupleClick(info) {
    if (info.phase === "settle") {
      const zoomLevel = this.editor.getZoomLevel();
      const {
        inputs: { currentScreenPoint }
      } = this.editor;
      if (zoomLevel === 1) {
        this.editor.zoomToFit({ animation: { duration: 400, easing: import_editor.EASINGS.easeOutQuint } });
      } else {
        this.editor.resetZoom(currentScreenPoint, {
          animation: { duration: 320, easing: import_editor.EASINGS.easeOutQuint }
        });
      }
    }
  }
}
//# sourceMappingURL=HandTool.js.map
