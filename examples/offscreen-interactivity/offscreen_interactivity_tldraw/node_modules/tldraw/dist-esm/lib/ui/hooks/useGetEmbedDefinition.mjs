import { useMaybeEditor } from "@tldraw/editor";
function useGetEmbedShapeUtil() {
  const editor = useMaybeEditor();
  if (!editor) return void 0;
  if (editor.hasShapeUtil("embed")) {
    return editor.getShapeUtil("embed");
  }
  return void 0;
}
function useGetEmbedDefinition() {
  const embedUtil = useGetEmbedShapeUtil();
  return (url) => {
    return embedUtil ? embedUtil.getEmbedDefinition(url) : void 0;
  };
}
export {
  useGetEmbedDefinition,
  useGetEmbedShapeUtil
};
//# sourceMappingURL=useGetEmbedDefinition.mjs.map
