import { useValue } from "@tldraw/state-react";
import { useSvgExportContext } from "../editor/types/SvgExportContext.mjs";
import { useEditor } from "./useEditor.mjs";
function useIsDarkMode() {
  const editor = useEditor();
  const exportContext = useSvgExportContext();
  return useValue("isDarkMode", () => exportContext?.isDarkMode ?? editor.user.getIsDarkMode(), [
    exportContext,
    editor
  ]);
}
export {
  useIsDarkMode
};
//# sourceMappingURL=useIsDarkMode.mjs.map
