import { useValue } from "@tldraw/state-react";
import { useEditor } from "./useEditor.mjs";
function useIsCropping(shapeId) {
  const editor = useEditor();
  return useValue("isCropping", () => editor.getCroppingShapeId() === shapeId, [editor, shapeId]);
}
export {
  useIsCropping
};
//# sourceMappingURL=useIsCropping.mjs.map
