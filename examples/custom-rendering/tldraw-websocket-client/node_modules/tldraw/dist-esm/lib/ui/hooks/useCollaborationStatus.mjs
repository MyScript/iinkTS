import { useMaybeEditor, useValue } from "@tldraw/editor";
function useShowCollaborationUi() {
  const editor = useMaybeEditor();
  return editor?.store.props.collaboration !== void 0;
}
function useCollaborationStatus() {
  const editor = useMaybeEditor();
  return useValue(
    "sync status",
    () => {
      if (!editor?.store.props.collaboration?.status) {
        return null;
      }
      return editor.store.props.collaboration.status.get();
    },
    [editor]
  );
}
export {
  useCollaborationStatus,
  useShowCollaborationUi
};
//# sourceMappingURL=useCollaborationStatus.mjs.map
