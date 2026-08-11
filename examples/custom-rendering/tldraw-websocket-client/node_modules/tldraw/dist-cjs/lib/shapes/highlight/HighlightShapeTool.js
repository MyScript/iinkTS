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
var HighlightShapeTool_exports = {};
__export(HighlightShapeTool_exports, {
  HighlightShapeTool: () => HighlightShapeTool
});
module.exports = __toCommonJS(HighlightShapeTool_exports);
var import_editor = require("@tldraw/editor");
var import_Drawing = require("../draw/toolStates/Drawing");
var import_Idle = require("../draw/toolStates/Idle");
class HighlightShapeTool extends import_editor.StateNode {
  static id = "highlight";
  static initial = "idle";
  static useCoalescedEvents = true;
  static children() {
    return [import_Idle.Idle, import_Drawing.Drawing];
  }
  static isLockable = false;
  shapeType = "highlight";
  onExit() {
    const drawingState = this.children["drawing"];
    drawingState.initialShape = void 0;
  }
}
//# sourceMappingURL=HighlightShapeTool.js.map
