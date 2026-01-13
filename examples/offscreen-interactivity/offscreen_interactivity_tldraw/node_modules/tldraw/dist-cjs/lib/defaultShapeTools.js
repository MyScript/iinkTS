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
var defaultShapeTools_exports = {};
__export(defaultShapeTools_exports, {
  defaultShapeTools: () => defaultShapeTools
});
module.exports = __toCommonJS(defaultShapeTools_exports);
var import_ArrowShapeTool = require("./shapes/arrow/ArrowShapeTool");
var import_DrawShapeTool = require("./shapes/draw/DrawShapeTool");
var import_FrameShapeTool = require("./shapes/frame/FrameShapeTool");
var import_GeoShapeTool = require("./shapes/geo/GeoShapeTool");
var import_HighlightShapeTool = require("./shapes/highlight/HighlightShapeTool");
var import_LineShapeTool = require("./shapes/line/LineShapeTool");
var import_NoteShapeTool = require("./shapes/note/NoteShapeTool");
var import_TextShapeTool = require("./shapes/text/TextShapeTool");
const defaultShapeTools = [
  import_TextShapeTool.TextShapeTool,
  import_DrawShapeTool.DrawShapeTool,
  import_GeoShapeTool.GeoShapeTool,
  import_NoteShapeTool.NoteShapeTool,
  import_LineShapeTool.LineShapeTool,
  import_FrameShapeTool.FrameShapeTool,
  import_ArrowShapeTool.ArrowShapeTool,
  import_HighlightShapeTool.HighlightShapeTool
];
//# sourceMappingURL=defaultShapeTools.js.map
