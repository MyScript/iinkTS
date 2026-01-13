import { useValue } from "@tldraw/state-react";
import { useEditor } from "./useEditor.mjs";
function useIsEditing(shapeId) {
  const editor = useEditor();
  return useValue("isEditing", () => editor.getEditingShapeId() === shapeId, [editor, shapeId]);
}
export {
  useIsEditing
};
//# sourceMappingURL=useIsEditing.mjs.map
