import { Group2d } from "@tldraw/editor";
function getTextLabels(geometry) {
  if (geometry.isLabel) {
    return [geometry];
  }
  if (geometry instanceof Group2d) {
    return geometry.children.filter((child) => child.isLabel);
  }
  return [];
}
export {
  getTextLabels
};
//# sourceMappingURL=shapes.mjs.map
