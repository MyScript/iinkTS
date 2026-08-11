import {
  DefaultColorStyle,
  DefaultDashStyle,
  DefaultFillStyle,
  DefaultSizeStyle,
  SharedStyleMap,
  useEditor,
  useValue
} from "@tldraw/editor";
const selectToolStyles = Object.freeze([
  DefaultColorStyle,
  DefaultDashStyle,
  DefaultFillStyle,
  DefaultSizeStyle
]);
function useRelevantStyles(stylesToCheck = selectToolStyles) {
  const editor = useEditor();
  return useValue(
    "getRelevantStyles",
    () => {
      const styles = new SharedStyleMap(editor.getSharedStyles());
      const isInShapeSpecificTool = !!editor.root.getCurrent()?.shapeType;
      const hasShapesSelected = editor.isIn("select") && editor.getSelectedShapeIds().length > 0;
      if (styles.size === 0 && editor.isIn("select") && editor.getSelectedShapeIds().length === 0) {
        for (const style of stylesToCheck) {
          styles.applyValue(style, editor.getStyleForNextShape(style));
        }
      }
      if (isInShapeSpecificTool || hasShapesSelected || styles.size > 0) {
        return styles;
      }
      return null;
    },
    [editor]
  );
}
export {
  useRelevantStyles
};
//# sourceMappingURL=useRelevantStyles.mjs.map
