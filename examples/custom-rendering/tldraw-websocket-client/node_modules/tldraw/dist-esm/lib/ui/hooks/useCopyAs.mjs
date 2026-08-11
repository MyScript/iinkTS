import { assert, useMaybeEditor } from "@tldraw/editor";
import { useCallback } from "react";
import { copyAs } from "../../utils/export/copyAs.mjs";
import { useToasts } from "../context/toasts.mjs";
import { useTranslation } from "./useTranslation/useTranslation.mjs";
function useCopyAs() {
  const editor = useMaybeEditor();
  const { addToast } = useToasts();
  const msg = useTranslation();
  return useCallback(
    (ids, format = "svg") => {
      assert(editor, "useCopyAs: editor is required");
      copyAs(editor, ids, { format }).catch(() => {
        addToast({
          id: "copy-fail",
          severity: "warning",
          title: msg("toast.error.copy-fail.title"),
          description: msg("toast.error.copy-fail.desc")
        });
      });
    },
    [editor, addToast, msg]
  );
}
export {
  useCopyAs
};
//# sourceMappingURL=useCopyAs.mjs.map
