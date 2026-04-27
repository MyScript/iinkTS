import { jsx } from "react/jsx-runtime";
import { DefaultShapeIndicators, useEditor, useValue } from "@tldraw/editor";
function TldrawShapeIndicators() {
  const editor = useEditor();
  const isInSelectState = useValue(
    "is in a valid select state",
    () => {
      return editor.isInAny(
        "select.idle",
        "select.brushing",
        "select.scribble_brushing",
        "select.editing_shape",
        "select.pointing_shape",
        "select.pointing_selection",
        "select.pointing_handle"
      );
    },
    [editor]
  );
  return /* @__PURE__ */ jsx(DefaultShapeIndicators, { hideAll: !isInSelectState });
}
export {
  TldrawShapeIndicators
};
//# sourceMappingURL=TldrawShapeIndicators.mjs.map
