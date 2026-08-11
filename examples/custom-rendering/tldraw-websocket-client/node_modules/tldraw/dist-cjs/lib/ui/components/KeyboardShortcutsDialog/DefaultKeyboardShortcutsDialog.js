"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var DefaultKeyboardShortcutsDialog_exports = {};
__export(DefaultKeyboardShortcutsDialog_exports, {
  DefaultKeyboardShortcutsDialog: () => DefaultKeyboardShortcutsDialog
});
module.exports = __toCommonJS(DefaultKeyboardShortcutsDialog_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_classnames = __toESM(require("classnames"));
var import_react = require("react");
var import_constants = require("../../constants");
var import_breakpoints = require("../../context/breakpoints");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiDialog = require("../primitives/TldrawUiDialog");
var import_TldrawUiMenuContext = require("../primitives/menus/TldrawUiMenuContext");
var import_DefaultKeyboardShortcutsDialogContent = require("./DefaultKeyboardShortcutsDialogContent");
const DefaultKeyboardShortcutsDialog = (0, import_react.memo)(function DefaultKeyboardShortcutsDialog2({
  children
}) {
  const msg = (0, import_useTranslation.useTranslation)();
  const breakpoint = (0, import_breakpoints.useBreakpoint)();
  const content = children ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_DefaultKeyboardShortcutsDialogContent.DefaultKeyboardShortcutsDialogContent, {});
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDialog.TldrawUiDialogHeader, { className: "tlui-shortcuts-dialog__header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDialog.TldrawUiDialogTitle, { children: msg("shortcuts-dialog.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDialog.TldrawUiDialogCloseButton, {})
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_TldrawUiDialog.TldrawUiDialogBody,
      {
        className: (0, import_classnames.default)("tlui-shortcuts-dialog__body", {
          "tlui-shortcuts-dialog__body__mobile": breakpoint <= import_constants.PORTRAIT_BREAKPOINT.MOBILE_XS,
          "tlui-shortcuts-dialog__body__tablet": breakpoint <= import_constants.PORTRAIT_BREAKPOINT.TABLET
        }),
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuContext.TldrawUiMenuContextProvider, { type: "keyboard-shortcuts", sourceId: "kbd", children: content })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-dialog__scrim" })
  ] });
});
//# sourceMappingURL=DefaultKeyboardShortcutsDialog.js.map
