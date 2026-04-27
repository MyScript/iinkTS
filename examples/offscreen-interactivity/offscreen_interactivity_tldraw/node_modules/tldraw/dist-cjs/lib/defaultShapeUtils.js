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
var defaultShapeUtils_exports = {};
__export(defaultShapeUtils_exports, {
  defaultShapeUtils: () => defaultShapeUtils
});
module.exports = __toCommonJS(defaultShapeUtils_exports);
var import_ArrowShapeUtil = require("./shapes/arrow/ArrowShapeUtil");
var import_BookmarkShapeUtil = require("./shapes/bookmark/BookmarkShapeUtil");
var import_DrawShapeUtil = require("./shapes/draw/DrawShapeUtil");
var import_EmbedShapeUtil = require("./shapes/embed/EmbedShapeUtil");
var import_FrameShapeUtil = require("./shapes/frame/FrameShapeUtil");
var import_GeoShapeUtil = require("./shapes/geo/GeoShapeUtil");
var import_HighlightShapeUtil = require("./shapes/highlight/HighlightShapeUtil");
var import_ImageShapeUtil = require("./shapes/image/ImageShapeUtil");
var import_LineShapeUtil = require("./shapes/line/LineShapeUtil");
var import_NoteShapeUtil = require("./shapes/note/NoteShapeUtil");
var import_TextShapeUtil = require("./shapes/text/TextShapeUtil");
var import_VideoShapeUtil = require("./shapes/video/VideoShapeUtil");
const defaultShapeUtils = [
  import_TextShapeUtil.TextShapeUtil,
  import_BookmarkShapeUtil.BookmarkShapeUtil,
  import_DrawShapeUtil.DrawShapeUtil,
  import_GeoShapeUtil.GeoShapeUtil,
  import_NoteShapeUtil.NoteShapeUtil,
  import_LineShapeUtil.LineShapeUtil,
  import_FrameShapeUtil.FrameShapeUtil,
  import_ArrowShapeUtil.ArrowShapeUtil,
  import_HighlightShapeUtil.HighlightShapeUtil,
  import_EmbedShapeUtil.EmbedShapeUtil,
  import_ImageShapeUtil.ImageShapeUtil,
  import_VideoShapeUtil.VideoShapeUtil
];
//# sourceMappingURL=defaultShapeUtils.js.map
