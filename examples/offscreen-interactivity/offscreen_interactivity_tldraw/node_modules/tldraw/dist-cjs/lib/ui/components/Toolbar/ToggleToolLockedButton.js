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
var ToggleToolLockedButton_exports = {};
__export(ToggleToolLockedButton_exports, {
  ToggleToolLockedButton: () => ToggleToolLockedButton
});
module.exports = __toCommonJS(ToggleToolLockedButton_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_classnames = __toESM(require("classnames"));
var import_constants = require("../../constants");
var import_breakpoints = require("../../context/breakpoints");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../primitives/Button/TldrawUiButtonIcon");
function ToggleToolLockedButton({ activeToolId }) {
  const editor = (0, import_editor.useEditor)();
  const breakpoint = (0, import_breakpoints.useBreakpoint)();
  const msg = (0, import_useTranslation.useTranslation)();
  const isToolLocked = (0, import_editor.useValue)("is tool locked", () => editor.getInstanceState().isToolLocked, [
    editor
  ]);
  const tool = (0, import_editor.useValue)("current tool", () => editor.getCurrentTool(), [editor]);
  if (!activeToolId || !tool.isLockable) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_TldrawUiButton.TldrawUiButton,
    {
      type: "normal",
      title: msg("action.toggle-tool-lock"),
      "data-testid": "tool-lock",
      className: (0, import_classnames.default)("tlui-toolbar__lock-button", {
        "tlui-toolbar__lock-button__mobile": breakpoint < import_constants.PORTRAIT_BREAKPOINT.TABLET_SM
      }),
      onClick: () => editor.updateInstanceState({ isToolLocked: !isToolLocked }),
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: isToolLocked ? "lock" : "unlock", small: true })
    }
  );
}
//# sourceMappingURL=ToggleToolLockedButton.js.map
