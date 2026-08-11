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
var warn_exports = {};
__export(warn_exports, {
  warnDeprecatedGetter: () => warnDeprecatedGetter,
  warnOnce: () => warnOnce
});
module.exports = __toCommonJS(warn_exports);
const usedWarnings = /* @__PURE__ */ new Set();
function warnDeprecatedGetter(name) {
  warnOnce(
    `Using '${name}' is deprecated and will be removed in the near future. Please refactor to use 'get${name[0].toLocaleUpperCase()}${name.slice(
      1
    )}' instead.`
  );
}
function warnOnce(message) {
  if (usedWarnings.has(message)) return;
  usedWarnings.add(message);
  console.warn(`[tldraw] ${message}`);
}
//# sourceMappingURL=warn.js.map
