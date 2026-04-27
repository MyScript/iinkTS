import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEditor, useEditorComponents, useValue } from "@tldraw/editor";
import { getArrowTargetState } from "../shapes/arrow/arrowTargetState.mjs";
function TldrawOverlays() {
  const editor = useEditor();
  const shouldShowArrowHints = useValue(
    "should show arrow hints",
    () => {
      if (editor.isInAny("arrow.idle", "arrow.pointing")) return true;
      if (editor.isIn("select.pointing_handle")) {
        const node = editor.getStateDescendant("select.pointing_handle");
        if (node.info.shape.type === "arrow" && (node.info.handle.id === "start" || node.info.handle.id === "end")) {
          return true;
        }
      }
      if (editor.isIn("select.dragging_handle")) {
        const node = editor.getStateDescendant("select.dragging_handle");
        if (node.info.shape.type === "arrow" && (node.info.handle.id === "start" || node.info.handle.id === "end")) {
          return true;
        }
      }
      return false;
    },
    [editor]
  );
  if (!shouldShowArrowHints) return null;
  return /* @__PURE__ */ jsx(TldrawArrowHints, {});
}
function TldrawArrowHints() {
  const editor = useEditor();
  const { ShapeIndicator } = useEditorComponents();
  const targetInfo = useValue("arrow target info", () => getArrowTargetState(editor), [editor]);
  if (!targetInfo) return null;
  const { handlesInPageSpace, snap, anchorInPageSpace, arrowKind, isExact, isPrecise } = targetInfo;
  const showEdgeHints = !isExact && arrowKind === "elbow";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    ShapeIndicator && /* @__PURE__ */ jsx(ShapeIndicator, { shapeId: targetInfo.target.id }),
    showEdgeHints && /* @__PURE__ */ jsxs("svg", { className: "tl-overlays__item", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsx(
        "circle",
        {
          cx: anchorInPageSpace.x,
          cy: anchorInPageSpace.y,
          className: `tl-arrow-hint-snap tl-arrow-hint-snap__${isPrecise ? snap ?? "none" : "none"}`
        }
      ),
      Object.entries(handlesInPageSpace).map(([side, handle]) => {
        if (!handle.isEnabled) return null;
        return /* @__PURE__ */ jsx(
          "circle",
          {
            cx: handle.point.x,
            cy: handle.point.y,
            className: "tl-arrow-hint-handle"
          },
          side
        );
      })
    ] })
  ] });
}
export {
  TldrawArrowHints,
  TldrawOverlays
};
//# sourceMappingURL=TldrawOverlays.mjs.map
