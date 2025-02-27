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
var Dialogs_exports = {};
__export(Dialogs_exports, {
  TldrawUiDialogs: () => TldrawUiDialogs
});
module.exports = __toCommonJS(Dialogs_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var _Dialog = __toESM(require("@radix-ui/react-dialog"));
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_dialogs = require("../context/dialogs");
const TldrawUiDialog = ({ id, component: ModalContent, onClose }) => {
  const { removeDialog } = (0, import_dialogs.useDialogs)();
  const container = (0, import_editor.useContainer)();
  const handleOpenChange = (0, import_react.useCallback)(
    (isOpen) => {
      if (!isOpen) {
        if (onClose) {
          try {
            onClose();
          } catch (err) {
            console.warn(err);
          }
        }
        removeDialog(id);
      }
    },
    [id, onClose, removeDialog]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_Dialog.Root, { onOpenChange: handleOpenChange, defaultOpen: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_Dialog.Portal, { container, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    _Dialog.Overlay,
    {
      dir: "ltr",
      className: "tlui-dialog__overlay",
      onClick: (e) => {
        if (e.target === e.currentTarget) handleOpenChange(false);
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_Dialog.Content, { dir: "ltr", className: "tlui-dialog__content", "aria-describedby": void 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalContent, { onClose: () => handleOpenChange(false) }) })
    }
  ) }) });
};
const TldrawUiDialogs = (0, import_react.memo)(function TldrawUiDialogs2() {
  const { dialogs } = (0, import_dialogs.useDialogs)();
  const dialogsArray = (0, import_editor.useValue)("dialogs", () => dialogs.get(), [dialogs]);
  return dialogsArray.map((dialog) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TldrawUiDialog, { ...dialog }, dialog.id));
});
//# sourceMappingURL=Dialogs.js.map
