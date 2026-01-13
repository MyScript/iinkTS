import { jsx } from "react/jsx-runtime";
import {
  Box
} from "@tldraw/editor";
function correctSpacesToNbsp(input) {
  return input.replace(/\s/g, "\xA0");
}
function createTextJsxFromSpans(editor, spans, opts) {
  const { padding = 0 } = opts;
  if (spans.length === 0) return null;
  const bounds = Box.From(spans[0].box);
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
        /* @__PURE__ */ jsx(
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
      /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx(
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
export {
  createTextJsxFromSpans
};
//# sourceMappingURL=createTextJsxFromSpans.mjs.map
