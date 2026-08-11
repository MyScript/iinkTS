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
var TLVerticalAlignStyle_exports = {};
__export(TLVerticalAlignStyle_exports, {
  DefaultVerticalAlignStyle: () => DefaultVerticalAlignStyle
});
module.exports = __toCommonJS(TLVerticalAlignStyle_exports);
var import_StyleProp = require("./StyleProp");
const DefaultVerticalAlignStyle = import_StyleProp.StyleProp.defineEnum("tldraw:verticalAlign", {
  defaultValue: "middle",
  values: ["start", "middle", "end"]
});
//# sourceMappingURL=TLVerticalAlignStyle.js.map
