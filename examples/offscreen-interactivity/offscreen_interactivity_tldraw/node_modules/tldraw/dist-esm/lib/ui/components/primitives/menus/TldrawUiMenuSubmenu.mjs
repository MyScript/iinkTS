import { jsx, jsxs } from "react/jsx-runtime";
import { useContainer } from "@tldraw/editor";
import { ContextMenu as _ContextMenu } from "radix-ui";
import { useMenuIsOpen } from "../../../hooks/useMenuIsOpen.mjs";
import { useTranslation } from "../../../hooks/useTranslation/useTranslation.mjs";
import { TldrawUiButton } from "../Button/TldrawUiButton.mjs";
import { TldrawUiButtonIcon } from "../Button/TldrawUiButtonIcon.mjs";
import { TldrawUiButtonLabel } from "../Button/TldrawUiButtonLabel.mjs";
import {
  TldrawUiDropdownMenuSub,
  TldrawUiDropdownMenuSubContent,
  TldrawUiDropdownMenuSubTrigger
} from "../TldrawUiDropdownMenu.mjs";
import { useTldrawUiMenuContext } from "./TldrawUiMenuContext.mjs";
function TldrawUiMenuSubmenu({
  id,
  disabled = false,
  label,
  size = "small",
  children
}) {
  const { type: menuType, sourceId } = useTldrawUiMenuContext();
  const container = useContainer();
  const msg = useTranslation();
  const labelToUse = label ? typeof label === "string" ? label : label[menuType] ?? label["default"] : void 0;
  const labelStr = labelToUse ? msg(labelToUse) : void 0;
  switch (menuType) {
    case "menu": {
      return /* @__PURE__ */ jsxs(TldrawUiDropdownMenuSub, { id: `${sourceId}-sub.${id}`, children: [
        /* @__PURE__ */ jsx(
          TldrawUiDropdownMenuSubTrigger,
          {
            id: `${sourceId}-sub.${id}-button`,
            disabled,
            label: labelStr,
            title: labelStr
          }
        ),
        /* @__PURE__ */ jsx(TldrawUiDropdownMenuSubContent, { id: `${sourceId}-sub.${id}-content`, size, children })
      ] });
    }
    case "context-menu": {
      if (disabled) return null;
      return /* @__PURE__ */ jsxs(ContextMenuSubWithMenu, { id: `${sourceId}-sub.${id}`, children: [
        /* @__PURE__ */ jsx(_ContextMenu.ContextMenuSubTrigger, { dir: "ltr", disabled, asChild: true, children: /* @__PURE__ */ jsxs(
          TldrawUiButton,
          {
            "data-testid": `${sourceId}-sub.${id}-button`,
            type: "menu",
            className: "tlui-menu__submenu__trigger",
            children: [
              /* @__PURE__ */ jsx(TldrawUiButtonLabel, { children: labelStr }),
              /* @__PURE__ */ jsx(TldrawUiButtonIcon, { icon: "chevron-right", small: true })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx(_ContextMenu.ContextMenuPortal, { container, children: /* @__PURE__ */ jsx(
          _ContextMenu.ContextMenuSubContent,
          {
            "data-testid": `${sourceId}-sub.${id}-content`,
            className: "tlui-menu tlui-menu__submenu__content",
            alignOffset: -1,
            sideOffset: -4,
            collisionPadding: 4,
            "data-size": size,
            children
          }
        ) })
      ] });
    }
    default: {
      return children;
    }
  }
}
function ContextMenuSubWithMenu({ id, children }) {
  const [open, onOpenChange] = useMenuIsOpen(id);
  return /* @__PURE__ */ jsx(_ContextMenu.ContextMenuSub, { open, onOpenChange, children });
}
export {
  ContextMenuSubWithMenu,
  TldrawUiMenuSubmenu
};
//# sourceMappingURL=TldrawUiMenuSubmenu.mjs.map
