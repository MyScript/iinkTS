import { jsx, jsxs } from "react/jsx-runtime";
import { useContainer } from "@tldraw/editor";
import { DropdownMenu as _DropdownMenu } from "radix-ui";
import { memo } from "react";
import { useMenuIsOpen } from "../../hooks/useMenuIsOpen.mjs";
import { useTranslation } from "../../hooks/useTranslation/useTranslation.mjs";
import { TldrawUiButton } from "../primitives/Button/TldrawUiButton.mjs";
import { TldrawUiButtonIcon } from "../primitives/Button/TldrawUiButtonIcon.mjs";
import { TldrawUiMenuContextProvider } from "../primitives/menus/TldrawUiMenuContext.mjs";
import { DefaultMainMenuContent } from "./DefaultMainMenuContent.mjs";
const DefaultMainMenu = memo(function DefaultMainMenu2({ children }) {
  const container = useContainer();
  const [isOpen, onOpenChange] = useMenuIsOpen("main menu");
  const msg = useTranslation();
  const content = children ?? /* @__PURE__ */ jsx(DefaultMainMenuContent, {});
  return /* @__PURE__ */ jsxs(_DropdownMenu.Root, { dir: "ltr", open: isOpen, onOpenChange, modal: false, children: [
    /* @__PURE__ */ jsx(_DropdownMenu.Trigger, { asChild: true, dir: "ltr", children: /* @__PURE__ */ jsx(TldrawUiButton, { type: "icon", "data-testid": "main-menu.button", title: msg("menu.title"), children: /* @__PURE__ */ jsx(TldrawUiButtonIcon, { icon: "menu", small: true }) }) }),
    /* @__PURE__ */ jsx(_DropdownMenu.Portal, { container, children: /* @__PURE__ */ jsx(
      _DropdownMenu.Content,
      {
        className: "tlui-menu",
        side: "bottom",
        align: "start",
        collisionPadding: 4,
        alignOffset: 0,
        sideOffset: 6,
        children: /* @__PURE__ */ jsx(TldrawUiMenuContextProvider, { type: "menu", sourceId: "main-menu", children: content })
      }
    ) })
  ] });
});
export {
  DefaultMainMenu
};
//# sourceMappingURL=DefaultMainMenu.mjs.map
