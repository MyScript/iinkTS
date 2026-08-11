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
var DefaultVideoToolbar_exports = {};
__export(DefaultVideoToolbar_exports, {
  DefaultVideoToolbar: () => DefaultVideoToolbar
});
module.exports = __toCommonJS(DefaultVideoToolbar_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiContextualToolbar = require("../primitives/TldrawUiContextualToolbar");
var import_AltTextEditor = require("./AltTextEditor");
var import_DefaultVideoToolbarContent = require("./DefaultVideoToolbarContent");
const DefaultVideoToolbar = (0, import_editor.track)(function DefaultVideoToolbar2({
  children
}) {
  const editor = (0, import_editor.useEditor)();
  const videoShapeId = (0, import_editor.useValue)(
    "videoShape",
    () => {
      const onlySelectedShape = editor.getOnlySelectedShape();
      if (!onlySelectedShape || onlySelectedShape.type !== "video") return null;
      return onlySelectedShape.id;
    },
    [editor]
  );
  const showToolbar = editor.isInAny("select.idle", "select.pointing_shape");
  const isLocked = (0, import_editor.useValue)(
    "locked",
    () => videoShapeId ? editor.getShape(videoShapeId)?.isLocked : false,
    [editor, videoShapeId]
  );
  if (!videoShapeId || !showToolbar || isLocked) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContextualToolbarInner, { videoShapeId, children }, videoShapeId);
});
function ContextualToolbarInner({
  children,
  videoShapeId
}) {
  const editor = (0, import_editor.useEditor)();
  const msg = (0, import_useTranslation.useTranslation)();
  const [isEditingAltText, setIsEditingAltText] = (0, import_react.useState)(false);
  const handleEditAltTextStart = (0, import_react.useCallback)(() => setIsEditingAltText(true), []);
  const onEditAltTextClose = (0, import_react.useCallback)(() => setIsEditingAltText(false), []);
  const getSelectionBounds = (0, import_react.useCallback)(() => {
    const fullBounds = editor.getSelectionScreenBounds();
    if (!fullBounds) return void 0;
    return new import_editor.Box(fullBounds.x, fullBounds.y, fullBounds.width, 0);
  }, [editor]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_TldrawUiContextualToolbar.TldrawUiContextualToolbar,
    {
      className: "tlui-video__toolbar",
      getSelectionBounds,
      label: msg("tool.video-toolbar-title"),
      children: children ? children : isEditingAltText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_AltTextEditor.AltTextEditor, { shapeId: videoShapeId, onClose: onEditAltTextClose, source: "video-toolbar" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_DefaultVideoToolbarContent.DefaultVideoToolbarContent,
        {
          videoShapeId,
          onEditAltTextStart: handleEditAltTextStart
        }
      )
    }
  );
}
//# sourceMappingURL=DefaultVideoToolbar.js.map
