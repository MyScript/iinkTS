import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ZoomTo100MenuItem, ZoomToFitMenuItem, ZoomToSelectionMenuItem } from "../menu-items.mjs";
import { TldrawUiMenuActionItem } from "../primitives/menus/TldrawUiMenuActionItem.mjs";
function DefaultZoomMenuContent() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(TldrawUiMenuActionItem, { actionId: "zoom-in", noClose: true }),
    /* @__PURE__ */ jsx(TldrawUiMenuActionItem, { actionId: "zoom-out", noClose: true }),
    /* @__PURE__ */ jsx(ZoomTo100MenuItem, {}),
    /* @__PURE__ */ jsx(ZoomToFitMenuItem, {}),
    /* @__PURE__ */ jsx(ZoomToSelectionMenuItem, {})
  ] });
}
export {
  DefaultZoomMenuContent
};
//# sourceMappingURL=DefaultZoomMenuContent.mjs.map
