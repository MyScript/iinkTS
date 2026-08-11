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
var DefaultHelpMenu_exports = {};
__export(DefaultHelpMenu_exports, {
  DefaultHelpMenu: () => DefaultHelpMenu
});
module.exports = __toCommonJS(DefaultHelpMenu_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_constants = require("../../constants");
var import_breakpoints = require("../../context/breakpoints");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../primitives/Button/TldrawUiButtonIcon");
var import_TldrawUiDropdownMenu = require("../primitives/TldrawUiDropdownMenu");
var import_TldrawUiMenuContext = require("../primitives/menus/TldrawUiMenuContext");
var import_DefaultHelpMenuContent = require("./DefaultHelpMenuContent");
const DefaultHelpMenu = (0, import_react.memo)(function DefaultHelpMenu2({ children }) {
  const msg = (0, import_useTranslation.useTranslation)();
  const breakpoint = (0, import_breakpoints.useBreakpoint)();
  const ref = (0, import_react.useRef)(null);
  (0, import_editor.usePassThroughWheelEvents)(ref);
  const content = children ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_DefaultHelpMenuContent.DefaultHelpMenuContent, {});
  if (breakpoint < import_constants.PORTRAIT_BREAKPOINT.MOBILE) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref, className: "tlui-help-menu", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuRoot, { id: "help menu", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButton.TldrawUiButton, { type: "help", title: msg("help-menu.title"), "data-testid": "help-menu.button", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "question-mark", small: true }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuContent, { side: "top", align: "end", alignOffset: 0, sideOffset: 8, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuContext.TldrawUiMenuContextProvider, { type: "menu", sourceId: "help-menu", children: content }) })
  ] }) });
});
//# sourceMappingURL=DefaultHelpMenu.js.map
