import { jsx } from "react/jsx-runtime";
import { useEditor, useValue } from "@tldraw/editor";
function TldrawHandles({ children }) {
  const editor = useEditor();
  const shouldDisplayHandles = useValue(
    "shouldDisplayHandles",
    () => {
      if (editor.isInAny("select.idle", "select.pointing_handle", "select.pointing_shape")) {
        return true;
      }
      if (editor.isInAny("select.editing_shape")) {
        const onlySelectedShape = editor.getOnlySelectedShape();
        return onlySelectedShape && editor.isShapeOfType(onlySelectedShape, "note");
      }
      return false;
    },
    [editor]
  );
  if (!shouldDisplayHandles) return null;
  return /* @__PURE__ */ jsx("svg", { className: "tl-user-handles tl-overlays__item", "aria-hidden": "true", children });
}
export {
  TldrawHandles
};
//# sourceMappingURL=TldrawHandles.mjs.map
