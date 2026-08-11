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
var DrawShapeTool_exports = {};
__export(DrawShapeTool_exports, {
  DrawShapeTool: () => DrawShapeTool
});
module.exports = __toCommonJS(DrawShapeTool_exports);
var import_editor = require("@tldraw/editor");
var import_Drawing = require("./toolStates/Drawing");
var import_Idle = require("./toolStates/Idle");
class DrawShapeTool extends import_editor.StateNode {
  static id = "draw";
  static initial = "idle";
  static isLockable = false;
  static useCoalescedEvents = true;
  static children() {
    return [import_Idle.Idle, import_Drawing.Drawing];
  }
  shapeType = "draw";
  onExit() {
    const drawingState = this.children["drawing"];
    drawingState.initialShape = void 0;
  }
}
//# sourceMappingURL=DrawShapeTool.js.map
