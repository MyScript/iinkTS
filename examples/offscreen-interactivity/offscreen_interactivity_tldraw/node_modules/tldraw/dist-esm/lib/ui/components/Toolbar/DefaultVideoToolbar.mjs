import { jsx } from "react/jsx-runtime";
import { Box, track, useEditor, useValue } from "@tldraw/editor";
import { useCallback, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation/useTranslation.mjs";
import { TldrawUiContextualToolbar } from "../primitives/TldrawUiContextualToolbar.mjs";
import { AltTextEditor } from "./AltTextEditor.mjs";
import { DefaultVideoToolbarContent } from "./DefaultVideoToolbarContent.mjs";
const DefaultVideoToolbar = track(function DefaultVideoToolbar2({
  children
}) {
  const editor = useEditor();
  const videoShapeId = useValue(
    "videoShape",
    () => {
      const onlySelectedShape = editor.getOnlySelectedShape();
      if (!onlySelectedShape || onlySelectedShape.type !== "video") return null;
      return onlySelectedShape.id;
    },
    [editor]
  );
  const showToolbar = editor.isInAny("select.idle", "select.pointing_shape");
  const isLocked = useValue(
    "locked",
    () => videoShapeId ? editor.getShape(videoShapeId)?.isLocked : false,
    [editor, videoShapeId]
  );
  if (!videoShapeId || !showToolbar || isLocked) return null;
  return /* @__PURE__ */ jsx(ContextualToolbarInner, { videoShapeId, children }, videoShapeId);
});
function ContextualToolbarInner({
  children,
  videoShapeId
}) {
  const editor = useEditor();
  const msg = useTranslation();
  const [isEditingAltText, setIsEditingAltText] = useState(false);
  const handleEditAltTextStart = useCallback(() => setIsEditingAltText(true), []);
  const onEditAltTextClose = useCallback(() => setIsEditingAltText(false), []);
  const getSelectionBounds = useCallback(() => {
    const fullBounds = editor.getSelectionScreenBounds();
    if (!fullBounds) return void 0;
    return new Box(fullBounds.x, fullBounds.y, fullBounds.width, 0);
  }, [editor]);
  return /* @__PURE__ */ jsx(
    TldrawUiContextualToolbar,
    {
      className: "tlui-video__toolbar",
      getSelectionBounds,
      label: msg("tool.video-toolbar-title"),
      children: children ? children : isEditingAltText ? /* @__PURE__ */ jsx(AltTextEditor, { shapeId: videoShapeId, onClose: onEditAltTextClose, source: "video-toolbar" }) : /* @__PURE__ */ jsx(
        DefaultVideoToolbarContent,
        {
          videoShapeId,
          onEditAltTextStart: handleEditAltTextStart
        }
      )
    }
  );
}
export {
  DefaultVideoToolbar
};
//# sourceMappingURL=DefaultVideoToolbar.mjs.map
