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
var kbd_utils_exports = {};
__export(kbd_utils_exports, {
  kbd: () => kbd,
  kbdStr: () => kbdStr
});
module.exports = __toCommonJS(kbd_utils_exports);
var import_editor = require("@tldraw/editor");
const cmdKey = import_editor.tlenv.isDarwin ? "\u2318" : "Ctrl";
const altKey = import_editor.tlenv.isDarwin ? "\u2325" : "Alt";
function kbd(str) {
  if (str === ",") return [","];
  return str.split(",")[0].split("").map((sub) => {
    const subStr = sub.replace(/\$/g, cmdKey).replace(/\?/g, altKey).replace(/!/g, "\u21E7");
    return subStr[0].toUpperCase() + subStr.slice(1);
  });
}
function kbdStr(str) {
  return "\u2014 " + kbd(str).join("\u2009");
}
//# sourceMappingURL=kbd-utils.js.map
