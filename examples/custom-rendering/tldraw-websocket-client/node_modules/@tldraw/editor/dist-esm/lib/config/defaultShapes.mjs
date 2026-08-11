import { GroupShapeUtil } from "../editor/shapes/group/GroupShapeUtil.mjs";
const coreShapes = [
  // created by grouping interactions, probably the corest core shape that we have
  GroupShapeUtil
];
const coreShapeTypes = new Set(coreShapes.map((s) => s.type));
function checkShapesAndAddCore(customShapes) {
  const shapes = [...coreShapes];
  const addedCustomShapeTypes = /* @__PURE__ */ new Set();
  for (const customShape of customShapes) {
    if (coreShapeTypes.has(customShape.type)) {
      throw new Error(
        `Shape type "${customShape.type}" is a core shapes type and cannot be overridden`
      );
    }
    if (addedCustomShapeTypes.has(customShape.type)) {
      throw new Error(`Shape type "${customShape.type}" is defined more than once`);
    }
    shapes.push(customShape);
    addedCustomShapeTypes.add(customShape.type);
  }
  return shapes;
}
export {
  checkShapesAndAddCore,
  coreShapes
};
//# sourceMappingURL=defaultShapes.mjs.map
