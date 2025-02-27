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
var BackToContent_exports = {};
__export(BackToContent_exports, {
  BackToContent: () => BackToContent
});
module.exports = __toCommonJS(BackToContent_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_actions = require("../../context/actions");
var import_TldrawUiMenuActionItem = require("../primitives/menus/TldrawUiMenuActionItem");
function BackToContent() {
  const editor = (0, import_editor.useEditor)();
  const actions = (0, import_actions.useActions)();
  const [showBackToContent, setShowBackToContent] = (0, import_react.useState)(false);
  const rIsShowing = (0, import_react.useRef)(false);
  (0, import_editor.useQuickReactor)(
    "toggle showback to content",
    () => {
      const showBackToContentPrev = rIsShowing.current;
      const shapeIds = editor.getCurrentPageShapeIds();
      let showBackToContentNow = false;
      if (shapeIds.size) {
        showBackToContentNow = shapeIds.size === editor.getCulledShapes().size;
      }
      if (showBackToContentPrev !== showBackToContentNow) {
        setShowBackToContent(showBackToContentNow);
        rIsShowing.current = showBackToContentNow;
      }
    },
    [editor]
  );
  if (!showBackToContent) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_TldrawUiMenuActionItem.TldrawUiMenuActionItem,
    {
      actionId: "back-to-content",
      onSelect: () => {
        actions["back-to-content"].onSelect("helper-buttons");
        setShowBackToContent(false);
      }
    }
  );
}
//# sourceMappingURL=BackToContent.js.map
