import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEditor, useValue } from "@tldraw/editor";
import { useShowCollaborationUi } from "../../hooks/useCollaborationStatus.mjs";
import {
  ArrangeMenuSubmenu,
  ClipboardMenuGroup,
  ConversionsMenuGroup,
  CursorChatItem,
  EditMenuSubmenu,
  MoveToPageMenu,
  ReorderMenuSubmenu,
  SelectAllMenuItem
} from "../menu-items.mjs";
import { TldrawUiMenuGroup } from "../primitives/menus/TldrawUiMenuGroup.mjs";
function DefaultContextMenuContent() {
  const editor = useEditor();
  const showCollaborationUi = useShowCollaborationUi();
  const selectToolActive = useValue(
    "isSelectToolActive",
    () => editor.getCurrentToolId() === "select",
    [editor]
  );
  const isSinglePageMode = useValue("isSinglePageMode", () => editor.options.maxPages <= 1, [
    editor
  ]);
  if (!selectToolActive) return null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    showCollaborationUi && /* @__PURE__ */ jsx(CursorChatItem, {}),
    /* @__PURE__ */ jsxs(TldrawUiMenuGroup, { id: "modify", children: [
      /* @__PURE__ */ jsx(EditMenuSubmenu, {}),
      /* @__PURE__ */ jsx(ArrangeMenuSubmenu, {}),
      /* @__PURE__ */ jsx(ReorderMenuSubmenu, {}),
      !isSinglePageMode && /* @__PURE__ */ jsx(MoveToPageMenu, {})
    ] }),
    /* @__PURE__ */ jsx(ClipboardMenuGroup, {}),
    /* @__PURE__ */ jsx(ConversionsMenuGroup, {}),
    /* @__PURE__ */ jsx(TldrawUiMenuGroup, { id: "select-all", children: /* @__PURE__ */ jsx(SelectAllMenuItem, {}) })
  ] });
}
export {
  DefaultContextMenuContent
};
//# sourceMappingURL=DefaultContextMenuContent.mjs.map
