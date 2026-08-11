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
var createTextJsxFromSpans_exports = {};
__export(createTextJsxFromSpans_exports, {
  createTextJsxFromSpans: () => createTextJsxFromSpans
});
module.exports = __toCommonJS(createTextJsxFromSpans_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
function correctSpacesToNbsp(input) {
  return input.replace(/\s/g, "\xA0");
}
function createTextJsxFromSpans(editor, spans, opts) {
  const { padding = 0 } = opts;
  if (spans.length === 0) return null;
  const bounds = import_editor.Box.From(spans[0].box);
  for (const { box } of spans) {
    bounds.union(box);
  }
  const offsetX = padding + (opts.offsetX ?? 0);
  const offsetY = (opts.offsetY ?? 0) + opts.fontSize / 2 + (opts.verticalTextAlign === "start" ? padding : opts.verticalTextAlign === "end" ? opts.height - padding - bounds.height : (Math.ceil(opts.height) - bounds.height) / 2);
  let currentLineTop = null;
  const children = [];
  for (const { text, box } of spans) {
    const didBreakLine = currentLineTop !== null && box.y > currentLineTop;
    if (didBreakLine) {
      children.push(
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "tspan",
          {
            alignmentBaseline: "mathematical",
            x: offsetX,
            y: box.y + offsetY,
            children: "\n"
          },
          children.length
        )
      );
    }
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "tspan",
        {
          alignmentBaseline: "mathematical",
          x: box.x + offsetX,
          y: box.y + offsetY,
          unicodeBidi: "plaintext",
          children: correctSpacesToNbsp(text)
        },
        children.length
      )
    );
    currentLineTop = box.y;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "text",
    {
      fontSize: opts.fontSize,
      fontFamily: opts.fontFamily,
      fontStyle: opts.fontStyle,
      fontWeight: opts.fontWeight,
      dominantBaseline: "mathematical",
      alignmentBaseline: "mathematical",
      stroke: opts.stroke,
      strokeWidth: opts.strokeWidth,
      fill: opts.fill,
      children
    }
  );
}
//# sourceMappingURL=createTextJsxFromSpans.js.map
