import { jsx, jsxs } from "react/jsx-runtime";
import { TldrawUiButton } from "../primitives/Button/TldrawUiButton.mjs";
import { TldrawUiButtonIcon } from "../primitives/Button/TldrawUiButtonIcon.mjs";
import {
  TldrawUiDropdownMenuContent,
  TldrawUiDropdownMenuRoot,
  TldrawUiDropdownMenuTrigger
} from "../primitives/TldrawUiDropdownMenu.mjs";
import { TldrawUiMenuContextProvider } from "../primitives/menus/TldrawUiMenuContext.mjs";
import { DefaultDebugMenuContent } from "./DefaultDebugMenuContent.mjs";
function DefaultDebugMenu({ children }) {
  const content = children ?? /* @__PURE__ */ jsx(DefaultDebugMenuContent, {});
  return /* @__PURE__ */ jsxs(TldrawUiDropdownMenuRoot, { id: "debug", children: [
    /* @__PURE__ */ jsx(TldrawUiDropdownMenuTrigger, { children: /* @__PURE__ */ jsx(TldrawUiButton, { type: "icon", title: "Debug menu", children: /* @__PURE__ */ jsx(TldrawUiButtonIcon, { icon: "dots-horizontal" }) }) }),
    /* @__PURE__ */ jsx(TldrawUiDropdownMenuContent, { side: "top", align: "end", alignOffset: 0, children: /* @__PURE__ */ jsx(TldrawUiMenuContextProvider, { type: "menu", sourceId: "debug-panel", children: content }) })
  ] });
}
export {
  DefaultDebugMenu
};
//# sourceMappingURL=DefaultDebugMenu.mjs.map
