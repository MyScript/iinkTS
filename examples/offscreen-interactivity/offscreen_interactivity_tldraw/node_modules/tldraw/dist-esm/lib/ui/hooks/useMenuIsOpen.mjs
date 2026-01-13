import { useGlobalMenuIsOpen, useMaybeEditor } from "@tldraw/editor";
import { useCallback } from "react";
import { useUiEvents } from "../context/events.mjs";
function useMenuIsOpen(id, cb) {
  const editor = useMaybeEditor();
  const onChange = useCallback(
    (isOpen) => {
      if (isOpen) {
        editor?.complete();
      }
      cb?.(isOpen);
    },
    [editor, cb]
  );
  const trackEvent = useUiEvents();
  const onEvent = useCallback(
    (eventName) => {
      trackEvent(eventName, { source: "unknown", id });
    },
    [id, trackEvent]
  );
  return useGlobalMenuIsOpen(editor ? `${id}-${editor.contextId}` : id, onChange, onEvent);
}
export {
  useMenuIsOpen
};
//# sourceMappingURL=useMenuIsOpen.mjs.map
