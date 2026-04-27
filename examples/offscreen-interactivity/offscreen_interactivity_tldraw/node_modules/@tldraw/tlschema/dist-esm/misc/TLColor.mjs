import { T } from "@tldraw/validate";
const TL_CANVAS_UI_COLOR_TYPES = /* @__PURE__ */ new Set([
  "accent",
  "white",
  "black",
  "selection-stroke",
  "selection-fill",
  "laser",
  "muted-1"
]);
const canvasUiColorTypeValidator = T.setEnum(TL_CANVAS_UI_COLOR_TYPES);
export {
  TL_CANVAS_UI_COLOR_TYPES,
  canvasUiColorTypeValidator
};
//# sourceMappingURL=TLColor.mjs.map
