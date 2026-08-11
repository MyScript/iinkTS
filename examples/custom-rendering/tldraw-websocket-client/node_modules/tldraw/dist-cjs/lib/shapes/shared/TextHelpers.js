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
var TextHelpers_exports = {};
__export(TextHelpers_exports, {
  INDENT: () => INDENT,
  TextHelpers: () => TextHelpers
});
module.exports = __toCommonJS(TextHelpers_exports);
const INDENT = "  ";
class TextHelpers {
  static fixNewLines = /\r?\n|\r/g;
  static normalizeText(text) {
    return text.replace(TextHelpers.fixNewLines, "\n");
  }
  static normalizeTextForDom(text) {
    return text.replace(TextHelpers.fixNewLines, "\n").split("\n").map((x) => x || " ").join("\n");
  }
}
//# sourceMappingURL=TextHelpers.js.map
