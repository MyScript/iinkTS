"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var DefaultToolbarContent_exports = {};
__export(DefaultToolbarContent_exports, {
  ArrowDownToolbarItem: () => ArrowDownToolbarItem,
  ArrowLeftToolbarItem: () => ArrowLeftToolbarItem,
  ArrowRightToolbarItem: () => ArrowRightToolbarItem,
  ArrowToolbarItem: () => ArrowToolbarItem,
  ArrowUpToolbarItem: () => ArrowUpToolbarItem,
  AssetToolbarItem: () => AssetToolbarItem,
  CheckBoxToolbarItem: () => CheckBoxToolbarItem,
  CloudToolbarItem: () => CloudToolbarItem,
  DefaultToolbarContent: () => DefaultToolbarContent,
  DiamondToolbarItem: () => DiamondToolbarItem,
  DrawToolbarItem: () => DrawToolbarItem,
  EllipseToolbarItem: () => EllipseToolbarItem,
  EraserToolbarItem: () => EraserToolbarItem,
  FrameToolbarItem: () => FrameToolbarItem,
  HandToolbarItem: () => HandToolbarItem,
  HeartToolbarItem: () => HeartToolbarItem,
  HexagonToolbarItem: () => HexagonToolbarItem,
  HighlightToolbarItem: () => HighlightToolbarItem,
  LaserToolbarItem: () => LaserToolbarItem,
  LineToolbarItem: () => LineToolbarItem,
  NoteToolbarItem: () => NoteToolbarItem,
  OvalToolbarItem: () => OvalToolbarItem,
  PentagonToolbarItem: () => PentagonToolbarItem,
  RectangleToolbarItem: () => RectangleToolbarItem,
  RhombusToolbarItem: () => RhombusToolbarItem,
  SelectToolbarItem: () => SelectToolbarItem,
  StarToolbarItem: () => StarToolbarItem,
  TextToolbarItem: () => TextToolbarItem,
  ToolbarItem: () => ToolbarItem,
  TrapezoidToolbarItem: () => TrapezoidToolbarItem,
  TriangleToolbarItem: () => TriangleToolbarItem,
  XBoxToolbarItem: () => XBoxToolbarItem,
  useIsToolSelected: () => useIsToolSelected
});
module.exports = __toCommonJS(DefaultToolbarContent_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_useTools = require("../../hooks/useTools");
var import_TldrawUiMenuToolItem = require("../primitives/menus/TldrawUiMenuToolItem");
function DefaultToolbarContent() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HandToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DrawToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EraserToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoteToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RectangleToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipseToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiamondToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HexagonToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OvalToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RhombusToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(XBoxToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckBoxToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeftToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRightToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HighlightToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LaserToolbarItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FrameToolbarItem, {})
  ] });
}
function useIsToolSelected(tool) {
  const editor = (0, import_editor.useEditor)();
  const geo = tool?.meta?.geo;
  return (0, import_editor.useValue)(
    "is tool selected",
    () => {
      if (!tool) return false;
      const activeToolId = editor.getCurrentToolId();
      if (activeToolId === "geo") {
        return geo === editor.getSharedStyles().getAsKnownValue(import_editor.GeoShapeGeoStyle);
      } else {
        return activeToolId === tool.id;
      }
    },
    [editor, tool?.id, geo]
  );
}
function ToolbarItem({ tool }) {
  const tools = (0, import_useTools.useTools)();
  const isSelected = useIsToolSelected(tools[tool]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: tool, isSelected });
}
function SelectToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "select" });
}
function HandToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "hand" });
}
function DrawToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "draw" });
}
function EraserToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "eraser" });
}
function ArrowToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "arrow" });
}
function TextToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "text" });
}
function NoteToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "note" });
}
function AssetToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuToolItem.TldrawUiMenuToolItem, { toolId: "asset" });
}
function RectangleToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "rectangle" });
}
function EllipseToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "ellipse" });
}
function DiamondToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "diamond" });
}
function TriangleToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "triangle" });
}
function TrapezoidToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "trapezoid" });
}
function RhombusToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "rhombus" });
}
function PentagonToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "pentagon" });
}
function HeartToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "heart" });
}
function HexagonToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "hexagon" });
}
function CloudToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "cloud" });
}
function StarToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "star" });
}
function OvalToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "oval" });
}
function XBoxToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "x-box" });
}
function CheckBoxToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "check-box" });
}
function ArrowLeftToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "arrow-left" });
}
function ArrowUpToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "arrow-up" });
}
function ArrowDownToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "arrow-down" });
}
function ArrowRightToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "arrow-right" });
}
function LineToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "line" });
}
function HighlightToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "highlight" });
}
function FrameToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "frame" });
}
function LaserToolbarItem() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarItem, { tool: "laser" });
}
//# sourceMappingURL=DefaultToolbarContent.js.map
