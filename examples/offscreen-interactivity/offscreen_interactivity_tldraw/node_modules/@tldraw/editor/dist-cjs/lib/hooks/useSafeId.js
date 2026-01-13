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
var useSafeId_exports = {};
__export(useSafeId_exports, {
  IdProvider: () => IdProvider,
  sanitizeId: () => sanitizeId,
  suffixSafeId: () => suffixSafeId,
  useSharedSafeId: () => useSharedSafeId,
  useUniqueSafeId: () => useUniqueSafeId
});
module.exports = __toCommonJS(useSafeId_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("@tldraw/utils");
var import_react = require("react");
function suffixSafeId(id, suffix) {
  return sanitizeId(`${id}_${suffix}`);
}
function useUniqueSafeId(suffix) {
  return sanitizeId(`${(0, import_react.useId)()}${suffix ?? ""}`);
}
function useSharedSafeId(id) {
  const idScope = (0, import_utils.assertExists)((0, import_react.useContext)(IdContext));
  return sanitizeId(`${idScope}_${id}`);
}
function sanitizeId(id) {
  return id.replace(/:/g, "_");
}
const IdContext = (0, import_react.createContext)(null);
function IdProvider({ children }) {
  const id = useUniqueSafeId();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IdContext.Provider, { value: id, children });
}
//# sourceMappingURL=useSafeId.js.map
