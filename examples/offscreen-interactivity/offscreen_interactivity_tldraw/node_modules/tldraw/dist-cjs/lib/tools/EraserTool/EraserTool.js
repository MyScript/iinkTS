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
var EraserTool_exports = {};
__export(EraserTool_exports, {
  EraserTool: () => EraserTool
});
module.exports = __toCommonJS(EraserTool_exports);
var import_editor = require("@tldraw/editor");
var import_Erasing = require("./childStates/Erasing");
var import_Idle = require("./childStates/Idle");
var import_Pointing = require("./childStates/Pointing");
class EraserTool extends import_editor.StateNode {
  static id = "eraser";
  static initial = "idle";
  static isLockable = false;
  static children() {
    return [import_Idle.Idle, import_Pointing.Pointing, import_Erasing.Erasing];
  }
  onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 });
  }
}
//# sourceMappingURL=EraserTool.js.map
