import { jsx, jsxs } from "react/jsx-runtime";
import { useContainer, useEditor, useValue } from "@tldraw/editor";
import { DropdownMenu as _DropdownMenu } from "radix-ui";
import { memo, useCallback } from "react";
import { PORTRAIT_BREAKPOINT } from "../../constants.mjs";
import { useBreakpoint } from "../../context/breakpoints.mjs";
import { useMenuIsOpen } from "../../hooks/useMenuIsOpen.mjs";
import { useTranslation } from "../../hooks/useTranslation/useTranslation.mjs";
import { TldrawUiToolbarButton } from "../primitives/TldrawUiToolbar.mjs";
import { TldrawUiMenuContextProvider } from "../primitives/menus/TldrawUiMenuContext.mjs";
import { DefaultZoomMenuContent } from "./DefaultZoomMenuContent.mjs";
const DefaultZoomMenu = memo(function DefaultZoomMenu2({ children }) {
  const container = useContainer();
  const [isOpen, onOpenChange] = useMenuIsOpen("zoom menu");
  const content = children ?? /* @__PURE__ */ jsx(DefaultZoomMenuContent, {});
  return /* @__PURE__ */ jsxs(_DropdownMenu.Root, { dir: "ltr", open: isOpen, onOpenChange, modal: false, children: [
    /* @__PURE__ */ jsx(ZoomTriggerButton, {}),
    /* @__PURE__ */ jsx(_DropdownMenu.Portal, { container, children: /* @__PURE__ */ jsx(
      _DropdownMenu.Content,
      {
        className: "tlui-menu",
        side: "top",
        align: "start",
        alignOffset: 0,
        sideOffset: 8,
        collisionPadding: 4,
        children: /* @__PURE__ */ jsx(TldrawUiMenuContextProvider, { type: "menu", sourceId: "zoom-menu", children: content })
      }
    ) })
  ] });
});
const ZoomTriggerButton = () => {
  const editor = useEditor();
  const breakpoint = useBreakpoint();
  const zoom = useValue("zoom", () => editor.getZoomLevel(), [editor]);
  const msg = useTranslation();
  const handleDoubleClick = useCallback(() => {
    editor.resetZoom(editor.getViewportScreenCenter(), {
      animation: { duration: editor.options.animationMediumMs }
    });
  }, [editor]);
  const value = `${Math.floor(zoom * 100)}%`;
  return /* @__PURE__ */ jsx(
    TldrawUiToolbarButton,
    {
      asChild: true,
      type: "icon",
      "aria-label": `${msg("navigation-zone.zoom")} \u2014 ${value}`,
      title: `${msg("navigation-zone.zoom")} \u2014 ${value}`,
      "data-testid": "minimap.zoom-menu-button",
      className: "tlui-zoom-menu__button",
      onDoubleClick: handleDoubleClick,
      children: /* @__PURE__ */ jsx(_DropdownMenu.Trigger, { dir: "ltr", children: breakpoint < PORTRAIT_BREAKPOINT.MOBILE ? null : /* @__PURE__ */ jsx("span", { style: { flexGrow: 0, textAlign: "center" }, children: value }) })
    }
  );
};
export {
  DefaultZoomMenu
};
//# sourceMappingURL=DefaultZoomMenu.mjs.map
