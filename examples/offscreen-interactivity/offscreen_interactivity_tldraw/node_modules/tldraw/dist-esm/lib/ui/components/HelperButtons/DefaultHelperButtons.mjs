import { jsx } from "react/jsx-runtime";
import { TldrawUiMenuContextProvider } from "../primitives/menus/TldrawUiMenuContext.mjs";
import { DefaultHelperButtonsContent } from "./DefaultHelperButtonsContent.mjs";
function DefaultHelperButtons({ children }) {
  const content = children ?? /* @__PURE__ */ jsx(DefaultHelperButtonsContent, {});
  return /* @__PURE__ */ jsx("div", { className: "tlui-helper-buttons", children: /* @__PURE__ */ jsx(TldrawUiMenuContextProvider, { type: "helper-buttons", sourceId: "helper-buttons", children: content }) });
}
export {
  DefaultHelperButtons
};
//# sourceMappingURL=DefaultHelperButtons.mjs.map
