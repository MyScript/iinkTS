import { jsx, jsxs } from "react/jsx-runtime";
import { usePassThroughWheelEvents } from "@tldraw/editor";
import { memo, useRef } from "react";
import { PORTRAIT_BREAKPOINT } from "../../constants.mjs";
import { useBreakpoint } from "../../context/breakpoints.mjs";
import { useTranslation } from "../../hooks/useTranslation/useTranslation.mjs";
import { TldrawUiButton } from "../primitives/Button/TldrawUiButton.mjs";
import { TldrawUiButtonIcon } from "../primitives/Button/TldrawUiButtonIcon.mjs";
import {
  TldrawUiDropdownMenuContent,
  TldrawUiDropdownMenuRoot,
  TldrawUiDropdownMenuTrigger
} from "../primitives/TldrawUiDropdownMenu.mjs";
import { TldrawUiMenuContextProvider } from "../primitives/menus/TldrawUiMenuContext.mjs";
import { DefaultHelpMenuContent } from "./DefaultHelpMenuContent.mjs";
const DefaultHelpMenu = memo(function DefaultHelpMenu2({ children }) {
  const msg = useTranslation();
  const breakpoint = useBreakpoint();
  const ref = useRef(null);
  usePassThroughWheelEvents(ref);
  const content = children ?? /* @__PURE__ */ jsx(DefaultHelpMenuContent, {});
  if (breakpoint < PORTRAIT_BREAKPOINT.MOBILE) return null;
  return /* @__PURE__ */ jsx("div", { ref, className: "tlui-help-menu", children: /* @__PURE__ */ jsxs(TldrawUiDropdownMenuRoot, { id: "help menu", children: [
    /* @__PURE__ */ jsx(TldrawUiDropdownMenuTrigger, { children: /* @__PURE__ */ jsx(TldrawUiButton, { type: "help", title: msg("help-menu.title"), "data-testid": "help-menu.button", children: /* @__PURE__ */ jsx(TldrawUiButtonIcon, { icon: "question-mark", small: true }) }) }),
    /* @__PURE__ */ jsx(TldrawUiDropdownMenuContent, { side: "top", align: "end", alignOffset: 0, sideOffset: 8, children: /* @__PURE__ */ jsx(TldrawUiMenuContextProvider, { type: "menu", sourceId: "help-menu", children: content }) })
  ] }) });
});
export {
  DefaultHelpMenu
};
//# sourceMappingURL=DefaultHelpMenu.mjs.map
