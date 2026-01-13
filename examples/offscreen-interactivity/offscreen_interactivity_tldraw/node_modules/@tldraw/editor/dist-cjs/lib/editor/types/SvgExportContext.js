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
var SvgExportContext_exports = {};
__export(SvgExportContext_exports, {
  SvgExportContextProvider: () => SvgExportContextProvider,
  useDelaySvgExport: () => useDelaySvgExport,
  useSvgExportContext: () => useSvgExportContext
});
module.exports = __toCommonJS(SvgExportContext_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("@tldraw/utils");
var import_react = require("react");
var import_useContainer = require("../../hooks/useContainer");
var import_useEditor = require("../../hooks/useEditor");
var import_useEvent = require("../../hooks/useEvent");
const Context = (0, import_react.createContext)(null);
function SvgExportContextProvider({
  context,
  editor,
  children
}) {
  const Provider = editor.options.exportProvider;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_useEditor.EditorProvider, { editor, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_useContainer.ContainerProvider, { container: editor.getContainer(), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Context.Provider, { value: context, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Provider, { children }) }) }) });
}
function useSvgExportContext() {
  return (0, import_react.useContext)(Context);
}
function useDelaySvgExport() {
  const ctx = (0, import_react.useContext)(Context);
  const [promise] = (0, import_react.useState)(import_utils.promiseWithResolve);
  (0, import_react.useEffect)(() => {
    ctx?.waitUntil(promise);
    return () => {
      promise.resolve();
    };
  }, [promise, ctx]);
  return (0, import_useEvent.useEvent)(() => {
    promise.resolve();
  });
}
//# sourceMappingURL=SvgExportContext.js.map
