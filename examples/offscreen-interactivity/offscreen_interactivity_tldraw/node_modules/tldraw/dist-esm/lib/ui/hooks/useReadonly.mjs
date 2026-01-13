import { useMaybeEditor, useValue } from "@tldraw/editor";
function useReadonly() {
  const editor = useMaybeEditor();
  return useValue("isReadonlyMode", () => !!editor?.getIsReadonly(), [editor]);
}
export {
  useReadonly
};
//# sourceMappingURL=useReadonly.mjs.map
