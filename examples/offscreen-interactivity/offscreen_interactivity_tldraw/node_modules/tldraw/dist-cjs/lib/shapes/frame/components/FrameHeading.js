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
var FrameHeading_exports = {};
__export(FrameHeading_exports, {
  FrameHeading: () => FrameHeading
});
module.exports = __toCommonJS(FrameHeading_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_frameHelpers = require("../frameHelpers");
var import_FrameLabelInput = require("./FrameLabelInput");
function FrameHeading({
  id,
  name,
  width,
  height
}) {
  const editor = (0, import_editor.useEditor)();
  const { side, translation } = (0, import_editor.useValue)(
    "shape rotation",
    () => {
      const shape = editor.getShape(id);
      if (!shape) {
        return {
          side: 0,
          translation: "translate(0, 0)"
        };
      }
      const labelSide = (0, import_frameHelpers.getFrameHeadingSide)(editor, shape);
      return {
        side: labelSide,
        translation: (0, import_frameHelpers.getFrameHeadingTranslation)(shape, labelSide, false)
      };
    },
    [editor, id]
  );
  const rInput = (0, import_react.useRef)(null);
  const isEditing = (0, import_editor.useIsEditing)(id);
  (0, import_react.useEffect)(() => {
    const el = rInput.current;
    if (el && isEditing) {
      el.focus();
      el.select();
    }
  }, [rInput, isEditing]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      className: "tl-frame-heading",
      style: {
        overflow: isEditing ? "visible" : "hidden",
        maxWidth: `calc(var(--tl-zoom) * ${side === 0 || side === 2 ? Math.ceil(width) : Math.ceil(height)}px + var(--space-5))`,
        bottom: "100%",
        transform: `${translation} scale(var(--tl-scale)) translateX(calc(-1 * var(--space-3))`
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tl-frame-heading-hit-area", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FrameLabelInput.FrameLabelInput, { ref: rInput, id, name, isEditing }) })
    }
  );
}
//# sourceMappingURL=FrameHeading.js.map
