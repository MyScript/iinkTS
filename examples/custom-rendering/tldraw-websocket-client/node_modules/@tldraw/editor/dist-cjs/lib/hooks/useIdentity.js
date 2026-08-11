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
var useIdentity_exports = {};
__export(useIdentity_exports, {
  useShallowArrayIdentity: () => useShallowArrayIdentity,
  useShallowObjectIdentity: () => useShallowObjectIdentity
});
module.exports = __toCommonJS(useIdentity_exports);
var import_utils = require("@tldraw/utils");
var import_react = require("react");
function useIdentity(value, isEqual) {
  const ref = (0, import_react.useRef)(value);
  if (isEqual(value, ref.current)) {
    return ref.current;
  }
  ref.current = value;
  return value;
}
const areNullableArraysShallowEqual = (a, b) => {
  a ??= null;
  b ??= null;
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return (0, import_utils.areArraysShallowEqual)(a, b);
};
function useShallowArrayIdentity(arr) {
  return useIdentity(arr, areNullableArraysShallowEqual);
}
const areNullableObjectsShallowEqual = (a, b) => {
  a ??= null;
  b ??= null;
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return (0, import_utils.areObjectsShallowEqual)(a, b);
};
function useShallowObjectIdentity(obj) {
  return useIdentity(obj, areNullableObjectsShallowEqual);
}
//# sourceMappingURL=useIdentity.js.map
