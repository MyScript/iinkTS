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
var useCopyAs_exports = {};
__export(useCopyAs_exports, {
  useCopyAs: () => useCopyAs
});
module.exports = __toCommonJS(useCopyAs_exports);
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_copyAs = require("../../utils/export/copyAs");
var import_toasts = require("../context/toasts");
var import_useTranslation = require("./useTranslation/useTranslation");
function useCopyAs() {
  const editor = (0, import_editor.useMaybeEditor)();
  const { addToast } = (0, import_toasts.useToasts)();
  const msg = (0, import_useTranslation.useTranslation)();
  return (0, import_react.useCallback)(
    (ids, format = "svg") => {
      (0, import_editor.assert)(editor, "useCopyAs: editor is required");
      (0, import_copyAs.copyAs)(editor, ids, { format }).catch(() => {
        addToast({
          id: "copy-fail",
          severity: "warning",
          title: msg("toast.error.copy-fail.title"),
          description: msg("toast.error.copy-fail.desc")
        });
      });
    },
    [editor, addToast, msg]
  );
}
//# sourceMappingURL=useCopyAs.js.map
