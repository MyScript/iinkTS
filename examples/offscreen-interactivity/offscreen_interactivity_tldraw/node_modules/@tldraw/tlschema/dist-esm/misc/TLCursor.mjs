import { T } from "@tldraw/validate";
const TL_CURSOR_TYPES = /* @__PURE__ */ new Set([
  "none",
  "default",
  "pointer",
  "cross",
  "grab",
  "rotate",
  "grabbing",
  "resize-edge",
  "resize-corner",
  "text",
  "move",
  "ew-resize",
  "ns-resize",
  "nesw-resize",
  "nwse-resize",
  "nesw-rotate",
  "nwse-rotate",
  "swne-rotate",
  "senw-rotate",
  "zoom-in",
  "zoom-out"
]);
const cursorTypeValidator = T.setEnum(TL_CURSOR_TYPES);
const cursorValidator = T.object({
  type: cursorTypeValidator,
  rotation: T.number
});
export {
  TL_CURSOR_TYPES,
  cursorTypeValidator,
  cursorValidator
};
//# sourceMappingURL=TLCursor.mjs.map
