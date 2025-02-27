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
var DefaultToolbar_exports = {};
__export(DefaultToolbar_exports, {
  DefaultToolbar: () => DefaultToolbar
});
module.exports = __toCommonJS(DefaultToolbar_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_constants = require("../../constants");
var import_breakpoints = require("../../context/breakpoints");
var import_components = require("../../context/components");
var import_useReadonly = require("../../hooks/useReadonly");
var import_MobileStylePanel = require("../MobileStylePanel");
var import_DefaultToolbarContent = require("./DefaultToolbarContent");
var import_OverflowingToolbar = require("./OverflowingToolbar");
var import_ToggleToolLockedButton = require("./ToggleToolLockedButton");
const DefaultToolbar = (0, import_react.memo)(function DefaultToolbar2({ children }) {
  const editor = (0, import_editor.useEditor)();
  const breakpoint = (0, import_breakpoints.useBreakpoint)();
  const isReadonlyMode = (0, import_useReadonly.useReadonly)();
  const activeToolId = (0, import_editor.useValue)("current tool id", () => editor.getCurrentToolId(), [editor]);
  const ref = (0, import_react.useRef)(null);
  (0, import_editor.usePassThroughWheelEvents)(ref);
  const { ActionsMenu, QuickActions } = (0, import_components.useTldrawUiComponents)();
  const showQuickActions = editor.options.actionShortcutsLocation === "menu" ? false : editor.options.actionShortcutsLocation === "toolbar" ? true : breakpoint < import_constants.PORTRAIT_BREAKPOINT.TABLET;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref, className: "tlui-toolbar", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-toolbar__inner", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-toolbar__left", children: [
      !isReadonlyMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-toolbar__extras", children: [
        showQuickActions && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-toolbar__extras__controls tlui-buttons__horizontal", children: [
          QuickActions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActions, {}),
          ActionsMenu && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionsMenu, {})
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ToggleToolLockedButton.ToggleToolLockedButton, { activeToolId })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_OverflowingToolbar.OverflowingToolbar, { children: children ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_DefaultToolbarContent.DefaultToolbarContent, {}) })
    ] }),
    breakpoint < import_constants.PORTRAIT_BREAKPOINT.TABLET_SM && !isReadonlyMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-toolbar__tools", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_MobileStylePanel.MobileStylePanel, {}) })
  ] }) });
});
//# sourceMappingURL=DefaultToolbar.js.map
