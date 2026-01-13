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
var useContainer_exports = {};
__export(useContainer_exports, {
  ContainerProvider: () => ContainerProvider,
  useContainer: () => useContainer,
  useContainerIfExists: () => useContainerIfExists
});
module.exports = __toCommonJS(useContainer_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("@tldraw/utils");
var import_react = require("react");
const ContainerContext = (0, import_react.createContext)(null);
function ContainerProvider({ container, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContainerContext.Provider, { value: container, children });
}
function useContainer() {
  return (0, import_utils.assertExists)((0, import_react.useContext)(ContainerContext), "useContainer used outside of <Tldraw />");
}
function useContainerIfExists() {
  return (0, import_react.useContext)(ContainerContext);
}
//# sourceMappingURL=useContainer.js.map
