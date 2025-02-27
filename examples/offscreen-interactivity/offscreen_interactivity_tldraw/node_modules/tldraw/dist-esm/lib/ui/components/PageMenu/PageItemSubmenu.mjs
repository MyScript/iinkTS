import { jsx, jsxs } from "react/jsx-runtime";
import { PageRecordType, track, useEditor } from "@tldraw/editor";
import { useCallback } from "react";
import { useUiEvents } from "../../context/events.mjs";
import { useTranslation } from "../../hooks/useTranslation/useTranslation.mjs";
import { TldrawUiButton } from "../primitives/Button/TldrawUiButton.mjs";
import { TldrawUiButtonIcon } from "../primitives/Button/TldrawUiButtonIcon.mjs";
import {
  TldrawUiDropdownMenuContent,
  TldrawUiDropdownMenuRoot,
  TldrawUiDropdownMenuTrigger
} from "../primitives/TldrawUiDropdownMenu.mjs";
import { TldrawUiMenuContextProvider } from "../primitives/menus/TldrawUiMenuContext.mjs";
import { TldrawUiMenuGroup } from "../primitives/menus/TldrawUiMenuGroup.mjs";
import { TldrawUiMenuItem } from "../primitives/menus/TldrawUiMenuItem.mjs";
import { onMovePage } from "./edit-pages-shared.mjs";
const PageItemSubmenu = track(function PageItemSubmenu2({
  index,
  listSize,
  item,
  onRename
}) {
  const editor = useEditor();
  const msg = useTranslation();
  const pages = editor.getPages();
  const trackEvent = useUiEvents();
  const onDuplicate = useCallback(() => {
    editor.markHistoryStoppingPoint("creating page");
    const newId = PageRecordType.createId();
    editor.duplicatePage(item.id, newId);
    trackEvent("duplicate-page", { source: "page-menu" });
  }, [editor, item, trackEvent]);
  const onMoveUp = useCallback(() => {
    onMovePage(editor, item.id, index, index - 1, trackEvent);
  }, [editor, item, index, trackEvent]);
  const onMoveDown = useCallback(() => {
    onMovePage(editor, item.id, index, index + 1, trackEvent);
  }, [editor, item, index, trackEvent]);
  const onDelete = useCallback(() => {
    editor.markHistoryStoppingPoint("deleting page");
    editor.deletePage(item.id);
    trackEvent("delete-page", { source: "page-menu" });
  }, [editor, item, trackEvent]);
  return /* @__PURE__ */ jsxs(TldrawUiDropdownMenuRoot, { id: `page item submenu ${index}`, children: [
    /* @__PURE__ */ jsx(TldrawUiDropdownMenuTrigger, { children: /* @__PURE__ */ jsx(TldrawUiButton, { type: "icon", title: msg("page-menu.submenu.title"), children: /* @__PURE__ */ jsx(TldrawUiButtonIcon, { icon: "dots-vertical", small: true }) }) }),
    /* @__PURE__ */ jsx(TldrawUiDropdownMenuContent, { alignOffset: 0, side: "right", sideOffset: -4, children: /* @__PURE__ */ jsxs(TldrawUiMenuContextProvider, { type: "menu", sourceId: "page-menu", children: [
      /* @__PURE__ */ jsxs(TldrawUiMenuGroup, { id: "modify", children: [
        onRename && /* @__PURE__ */ jsx(TldrawUiMenuItem, { id: "rename", label: "page-menu.submenu.rename", onSelect: onRename }),
        /* @__PURE__ */ jsx(
          TldrawUiMenuItem,
          {
            id: "duplicate",
            label: "page-menu.submenu.duplicate-page",
            onSelect: onDuplicate,
            disabled: pages.length >= editor.options.maxPages
          }
        ),
        index > 0 && /* @__PURE__ */ jsx(
          TldrawUiMenuItem,
          {
            id: "move-up",
            onSelect: onMoveUp,
            label: "page-menu.submenu.move-up"
          }
        ),
        index < listSize - 1 && /* @__PURE__ */ jsx(
          TldrawUiMenuItem,
          {
            id: "move-down",
            label: "page-menu.submenu.move-down",
            onSelect: onMoveDown
          }
        )
      ] }),
      listSize > 1 && /* @__PURE__ */ jsx(TldrawUiMenuGroup, { id: "delete", children: /* @__PURE__ */ jsx(TldrawUiMenuItem, { id: "delete", onSelect: onDelete, label: "page-menu.submenu.delete" }) })
    ] }) })
  ] });
});
export {
  PageItemSubmenu
};
//# sourceMappingURL=PageItemSubmenu.mjs.map
