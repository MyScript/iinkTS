import { Box } from "@tldraw/editor";
function getLegacyOffsetX(align, padding, spans, totalWidth) {
  if ((align === "start-legacy" || align === "end-legacy") && spans.length !== 0) {
    const spansBounds = Box.From(spans[0].box);
    for (const { box } of spans) {
      spansBounds.union(box);
    }
    if (align === "start-legacy") {
      return (totalWidth - 2 * padding - spansBounds.width) / 2;
    } else if (align === "end-legacy") {
      return -(totalWidth - 2 * padding - spansBounds.width) / 2;
    }
  }
}
function isLegacyAlign(align) {
  return align === "start-legacy" || align === "middle-legacy" || align === "end-legacy";
}
export {
  getLegacyOffsetX,
  isLegacyAlign
};
//# sourceMappingURL=legacyProps.mjs.map
