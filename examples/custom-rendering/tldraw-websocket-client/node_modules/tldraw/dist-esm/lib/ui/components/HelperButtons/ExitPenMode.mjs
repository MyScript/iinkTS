import { jsx } from "react/jsx-runtime";
import { useEditor, useValue } from "@tldraw/editor";
import { TldrawUiMenuActionItem } from "../primitives/menus/TldrawUiMenuActionItem.mjs";
function ExitPenMode() {
  const editor = useEditor();
  const isPenMode = useValue("is pen mode", () => editor.getInstanceState().isPenMode, [editor]);
  if (!isPenMode) return null;
  return /* @__PURE__ */ jsx(TldrawUiMenuActionItem, { actionId: "exit-pen-mode" });
}
export {
  ExitPenMode
};
//# sourceMappingURL=ExitPenMode.mjs.map
