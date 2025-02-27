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
var TldrawUiDialog_exports = {};
__export(TldrawUiDialog_exports, {
  TldrawUiDialogBody: () => TldrawUiDialogBody,
  TldrawUiDialogCloseButton: () => TldrawUiDialogCloseButton,
  TldrawUiDialogFooter: () => TldrawUiDialogFooter,
  TldrawUiDialogHeader: () => TldrawUiDialogHeader,
  TldrawUiDialogTitle: () => TldrawUiDialogTitle
});
module.exports = __toCommonJS(TldrawUiDialog_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var _Dialog = __toESM(require("@radix-ui/react-dialog"));
var import_classnames = __toESM(require("classnames"));
var import_TldrawUiButton = require("./Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("./Button/TldrawUiButtonIcon");
function TldrawUiDialogHeader({ className, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: (0, import_classnames.default)("tlui-dialog__header", className), children });
}
function TldrawUiDialogTitle({ className, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_Dialog.DialogTitle, { dir: "ltr", className: (0, import_classnames.default)("tlui-dialog__header__title", className), children });
}
function TldrawUiDialogCloseButton() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-dialog__header__close", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_Dialog.DialogClose, { "data-testid": "dialog.close", dir: "ltr", asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_TldrawUiButton.TldrawUiButton,
    {
      type: "icon",
      "aria-label": "Close",
      onTouchEnd: (e) => e.target.click(),
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { small: true, icon: "cross-2" })
    }
  ) }) });
}
function TldrawUiDialogBody({ className, children, style }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: (0, import_classnames.default)("tlui-dialog__body", className), style, children });
}
function TldrawUiDialogFooter({ className, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: (0, import_classnames.default)("tlui-dialog__footer", className), children });
}
//# sourceMappingURL=TldrawUiDialog.js.map
