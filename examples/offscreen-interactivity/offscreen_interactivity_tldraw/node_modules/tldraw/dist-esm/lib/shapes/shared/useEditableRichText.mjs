import { isAccelKey, useEditor } from "@tldraw/editor";
import { useCallback, useEffect, useRef } from "react";
import { isEmptyRichText } from "../../utils/text/richText.mjs";
import { useEditableTextCommon } from "./useEditablePlainText.mjs";
function useEditableRichText(shapeId, type, richText) {
  const commonUseEditableTextHandlers = useEditableTextCommon(shapeId);
  const isEditing = commonUseEditableTextHandlers.isEditing;
  const editor = useEditor();
  const rInput = useRef(null);
  const isEmpty = richText && isEmptyRichText(richText);
  useEffect(() => {
    if (!isEditing) return;
    const contentEditable = rInput.current?.querySelector("[contenteditable]");
    if (contentEditable && document.activeElement !== rInput.current) {
      ;
      contentEditable.focus();
    }
  }, [editor, isEditing]);
  const handleKeyDown = useCallback(
    (e) => {
      if (editor.getEditingShapeId() !== shapeId) return;
      if (e.key === "Enter" && isAccelKey(e)) editor.complete();
    },
    [editor, shapeId]
  );
  const handleChange = useCallback(
    ({ richText: richText2 }) => {
      if (editor.getEditingShapeId() !== shapeId) return;
      editor.updateShape({
        id: shapeId,
        type,
        props: { richText: richText2 }
      });
    },
    [editor, shapeId, type]
  );
  return {
    rInput,
    handleKeyDown,
    handleChange,
    isEmpty,
    ...commonUseEditableTextHandlers
  };
}
export {
  useEditableRichText
};
//# sourceMappingURL=useEditableRichText.mjs.map
