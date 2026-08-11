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
var value_exports = {};
__export(value_exports, {
  STRUCTURED_CLONE_OBJECT_PROTOTYPE: () => STRUCTURED_CLONE_OBJECT_PROTOTYPE,
  isDefined: () => isDefined,
  isNativeStructuredClone: () => isNativeStructuredClone,
  isNonNull: () => isNonNull,
  isNonNullish: () => isNonNullish,
  structuredClone: () => structuredClone
});
module.exports = __toCommonJS(value_exports);
function isDefined(value) {
  return value !== void 0;
}
function isNonNull(value) {
  return value !== null;
}
function isNonNullish(value) {
  return value !== null && value !== void 0;
}
function getStructuredClone() {
  if (typeof globalThis !== "undefined" && globalThis.structuredClone) {
    return [globalThis.structuredClone, true];
  }
  if (typeof global !== "undefined" && global.structuredClone) {
    return [global.structuredClone, true];
  }
  if (typeof window !== "undefined" && window.structuredClone) {
    return [window.structuredClone, true];
  }
  return [(i) => i ? JSON.parse(JSON.stringify(i)) : i, false];
}
const _structuredClone = getStructuredClone();
const structuredClone = _structuredClone[0];
const isNativeStructuredClone = _structuredClone[1];
const STRUCTURED_CLONE_OBJECT_PROTOTYPE = Object.getPrototypeOf(structuredClone({}));
//# sourceMappingURL=value.js.map
