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
var BaseBoxShapeTool_exports = {};
__export(BaseBoxShapeTool_exports, {
  BaseBoxShapeTool: () => BaseBoxShapeTool
});
module.exports = __toCommonJS(BaseBoxShapeTool_exports);
var import_StateNode = require("../StateNode");
var import_Idle = require("./children/Idle");
var import_Pointing = require("./children/Pointing");
class BaseBoxShapeTool extends import_StateNode.StateNode {
  static id = "box";
  static initial = "idle";
  static children() {
    return [import_Idle.Idle, import_Pointing.Pointing];
  }
}
//# sourceMappingURL=BaseBoxShapeTool.js.map
