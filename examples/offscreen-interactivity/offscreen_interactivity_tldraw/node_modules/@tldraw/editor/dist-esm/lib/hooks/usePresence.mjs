import { useValue } from "@tldraw/state-react";
import { useEditor } from "./useEditor.mjs";
function usePresence(userId) {
  const editor = useEditor();
  const latestPresence = useValue(
    `latestPresence:${userId}`,
    () => {
      return editor.getCollaborators().find((c) => c.userId === userId);
    },
    [editor, userId]
  );
  return latestPresence ?? null;
}
export {
  usePresence
};
//# sourceMappingURL=usePresence.mjs.map
