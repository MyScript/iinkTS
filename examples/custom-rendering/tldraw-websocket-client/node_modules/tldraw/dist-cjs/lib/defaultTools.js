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
var defaultTools_exports = {};
__export(defaultTools_exports, {
  defaultTools: () => defaultTools
});
module.exports = __toCommonJS(defaultTools_exports);
var import_EraserTool = require("./tools/EraserTool/EraserTool");
var import_HandTool = require("./tools/HandTool/HandTool");
var import_LaserTool = require("./tools/LaserTool/LaserTool");
var import_SelectTool = require("./tools/SelectTool/SelectTool");
var import_ZoomTool = require("./tools/ZoomTool/ZoomTool");
const defaultTools = [import_EraserTool.EraserTool, import_HandTool.HandTool, import_LaserTool.LaserTool, import_ZoomTool.ZoomTool, import_SelectTool.SelectTool];
//# sourceMappingURL=defaultTools.js.map
