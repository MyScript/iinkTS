import {
  Box,
  Vec,
  compact,
  createShapeId,
  isShapeId,
  transact,
  useEditor
} from "@tldraw/editor";
import { useCallback } from "react";
async function flattenShapesToImages(editor, shapeIds, flattenImageBoundsExpand) {
  const shapes = compact(
    shapeIds.map((id) => {
      const shape = editor.getShape(id);
      if (!shape) return;
      const util = editor.getShapeUtil(shape.type);
      if (util.toSvg === void 0) return;
      return shape;
    })
  );
  if (shapes.length === 0) return;
  if (shapes.length === 1) {
    const shape = shapes[0];
    if (!shape) return;
    if (editor.isShapeOfType(shape, "image")) return;
  }
  const groups = [];
  if (flattenImageBoundsExpand !== void 0) {
    const expandedBounds = shapes.map((shape) => {
      return {
        shape,
        bounds: editor.getShapeMaskedPageBounds(shape).clone().expandBy(flattenImageBoundsExpand)
      };
    });
    for (let i = 0; i < expandedBounds.length; i++) {
      const item = expandedBounds[i];
      if (i === 0) {
        groups[0] = {
          shapes: [item.shape],
          bounds: item.bounds
        };
        continue;
      }
      let didLand = false;
      for (const group of groups) {
        if (group.bounds.includes(item.bounds)) {
          group.shapes.push(item.shape);
          group.bounds.expand(item.bounds);
          didLand = true;
          break;
        }
      }
      if (!didLand) {
        groups.push({
          shapes: [item.shape],
          bounds: item.bounds
        });
      }
    }
  } else {
    const bounds = Box.Common(shapes.map((shape) => editor.getShapeMaskedPageBounds(shape)));
    groups.push({
      shapes,
      bounds
    });
  }
  const padding = editor.options.flattenImageBoundsPadding;
  for (const group of groups) {
    if (flattenImageBoundsExpand !== void 0) {
      group.bounds.expandBy(-flattenImageBoundsExpand);
    }
    const svgResult = await editor.getSvgString(group.shapes, {
      padding,
      background: false
    });
    if (!svgResult?.svg) continue;
    const asset = await editor.getAssetForExternalContent({
      type: "file",
      file: new File([svgResult.svg], "asset.svg", { type: "image/svg+xml" })
    });
    if (!asset) continue;
    group.asset = asset;
  }
  const createdShapeIds = [];
  transact(() => {
    for (const group of groups) {
      const { asset, bounds, shapes: shapes2 } = group;
      if (!asset) continue;
      const commonAncestorId = editor.findCommonAncestor(shapes2) ?? editor.getCurrentPageId();
      if (!commonAncestorId) continue;
      let index = "a1";
      for (const shape of shapes2) {
        if (shape.parentId === commonAncestorId) {
          if (shape.index > index) {
            index = shape.index;
          }
          break;
        }
      }
      let x;
      let y;
      let rotation;
      if (isShapeId(commonAncestorId)) {
        const commonAncestor = editor.getShape(commonAncestorId);
        if (!commonAncestor) continue;
        const point = editor.getPointInShapeSpace(commonAncestor, {
          x: bounds.x,
          y: bounds.y
        });
        rotation = editor.getShapePageTransform(commonAncestorId).rotation();
        point.sub(new Vec(padding, padding).rot(-rotation));
        x = point.x;
        y = point.y;
      } else {
        x = bounds.x - padding;
        y = bounds.y - padding;
        rotation = 0;
      }
      editor.deleteShapes(shapes2);
      editor.createAssets([{ ...asset, id: asset.id }]);
      const shapeId = createShapeId();
      editor.createShape({
        id: shapeId,
        type: "image",
        index,
        parentId: commonAncestorId,
        x,
        y,
        rotation: -rotation,
        props: {
          assetId: asset.id,
          w: bounds.w + padding * 2,
          h: bounds.h + padding * 2
        }
      });
      createdShapeIds.push(shapeId);
    }
  });
  return createdShapeIds;
}
function useFlatten() {
  const editor = useEditor();
  return useCallback(
    (ids) => {
      return flattenShapesToImages(editor, ids);
    },
    [editor]
  );
}
export {
  flattenShapesToImages,
  useFlatten
};
//# sourceMappingURL=useFlatten.mjs.map
