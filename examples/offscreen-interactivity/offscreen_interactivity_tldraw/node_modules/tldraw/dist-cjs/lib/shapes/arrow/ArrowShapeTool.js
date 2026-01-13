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
var ArrowShapeTool_exports = {};
__export(ArrowShapeTool_exports, {
  ArrowShapeTool: () => ArrowShapeTool
});
module.exports = __toCommonJS(ArrowShapeTool_exports);
var import_editor = require("@tldraw/editor");
var import_Idle = require("./toolStates/Idle");
var import_Pointing = require("./toolStates/Pointing");
class ArrowShapeTool extends import_editor.StateNode {
  static id = "arrow";
  static initial = "idle";
  static children() {
    return [import_Idle.Idle, import_Pointing.Pointing];
  }
  shapeType = "arrow";
}
//# sourceMappingURL=ArrowShapeTool.js.map
