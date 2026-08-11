import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { GeoShapeGeoStyle, useEditor, useValue } from "@tldraw/editor";
import { useTools } from "../../hooks/useTools.mjs";
import { TldrawUiMenuToolItem } from "../primitives/menus/TldrawUiMenuToolItem.mjs";
function DefaultToolbarContent() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SelectToolbarItem, {}),
    /* @__PURE__ */ jsx(HandToolbarItem, {}),
    /* @__PURE__ */ jsx(DrawToolbarItem, {}),
    /* @__PURE__ */ jsx(EraserToolbarItem, {}),
    /* @__PURE__ */ jsx(ArrowToolbarItem, {}),
    /* @__PURE__ */ jsx(TextToolbarItem, {}),
    /* @__PURE__ */ jsx(NoteToolbarItem, {}),
    /* @__PURE__ */ jsx(AssetToolbarItem, {}),
    /* @__PURE__ */ jsx(RectangleToolbarItem, {}),
    /* @__PURE__ */ jsx(EllipseToolbarItem, {}),
    /* @__PURE__ */ jsx(TriangleToolbarItem, {}),
    /* @__PURE__ */ jsx(DiamondToolbarItem, {}),
    /* @__PURE__ */ jsx(HexagonToolbarItem, {}),
    /* @__PURE__ */ jsx(OvalToolbarItem, {}),
    /* @__PURE__ */ jsx(RhombusToolbarItem, {}),
    /* @__PURE__ */ jsx(StarToolbarItem, {}),
    /* @__PURE__ */ jsx(CloudToolbarItem, {}),
    /* @__PURE__ */ jsx(HeartToolbarItem, {}),
    /* @__PURE__ */ jsx(XBoxToolbarItem, {}),
    /* @__PURE__ */ jsx(CheckBoxToolbarItem, {}),
    /* @__PURE__ */ jsx(ArrowLeftToolbarItem, {}),
    /* @__PURE__ */ jsx(ArrowUpToolbarItem, {}),
    /* @__PURE__ */ jsx(ArrowDownToolbarItem, {}),
    /* @__PURE__ */ jsx(ArrowRightToolbarItem, {}),
    /* @__PURE__ */ jsx(LineToolbarItem, {}),
    /* @__PURE__ */ jsx(HighlightToolbarItem, {}),
    /* @__PURE__ */ jsx(LaserToolbarItem, {}),
    /* @__PURE__ */ jsx(FrameToolbarItem, {})
  ] });
}
function useIsToolSelected(tool) {
  const editor = useEditor();
  const geo = tool?.meta?.geo;
  return useValue(
    "is tool selected",
    () => {
      if (!tool) return false;
      const activeToolId = editor.getCurrentToolId();
      if (activeToolId === "geo") {
        return geo === editor.getSharedStyles().getAsKnownValue(GeoShapeGeoStyle);
      } else {
        return activeToolId === tool.id;
      }
    },
    [editor, tool?.id, geo]
  );
}
function ToolbarItem({ tool }) {
  const tools = useTools();
  const isSelected = useIsToolSelected(tools[tool]);
  return /* @__PURE__ */ jsx(TldrawUiMenuToolItem, { toolId: tool, isSelected });
}
function SelectToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "select" });
}
function HandToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "hand" });
}
function DrawToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "draw" });
}
function EraserToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "eraser" });
}
function ArrowToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "arrow" });
}
function TextToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "text" });
}
function NoteToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "note" });
}
function AssetToolbarItem() {
  return /* @__PURE__ */ jsx(TldrawUiMenuToolItem, { toolId: "asset" });
}
function RectangleToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "rectangle" });
}
function EllipseToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "ellipse" });
}
function DiamondToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "diamond" });
}
function TriangleToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "triangle" });
}
function TrapezoidToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "trapezoid" });
}
function RhombusToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "rhombus" });
}
function PentagonToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "pentagon" });
}
function HeartToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "heart" });
}
function HexagonToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "hexagon" });
}
function CloudToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "cloud" });
}
function StarToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "star" });
}
function OvalToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "oval" });
}
function XBoxToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "x-box" });
}
function CheckBoxToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "check-box" });
}
function ArrowLeftToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "arrow-left" });
}
function ArrowUpToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "arrow-up" });
}
function ArrowDownToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "arrow-down" });
}
function ArrowRightToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "arrow-right" });
}
function LineToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "line" });
}
function HighlightToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "highlight" });
}
function FrameToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "frame" });
}
function LaserToolbarItem() {
  return /* @__PURE__ */ jsx(ToolbarItem, { tool: "laser" });
}
export {
  ArrowDownToolbarItem,
  ArrowLeftToolbarItem,
  ArrowRightToolbarItem,
  ArrowToolbarItem,
  ArrowUpToolbarItem,
  AssetToolbarItem,
  CheckBoxToolbarItem,
  CloudToolbarItem,
  DefaultToolbarContent,
  DiamondToolbarItem,
  DrawToolbarItem,
  EllipseToolbarItem,
  EraserToolbarItem,
  FrameToolbarItem,
  HandToolbarItem,
  HeartToolbarItem,
  HexagonToolbarItem,
  HighlightToolbarItem,
  LaserToolbarItem,
  LineToolbarItem,
  NoteToolbarItem,
  OvalToolbarItem,
  PentagonToolbarItem,
  RectangleToolbarItem,
  RhombusToolbarItem,
  SelectToolbarItem,
  StarToolbarItem,
  TextToolbarItem,
  ToolbarItem,
  TrapezoidToolbarItem,
  TriangleToolbarItem,
  XBoxToolbarItem,
  useIsToolSelected
};
//# sourceMappingURL=DefaultToolbarContent.mjs.map
