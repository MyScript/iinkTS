import { jsx } from "react/jsx-runtime";
import { useValue } from "@tldraw/state-react";
import classNames from "classnames";
import { useRef } from "react";
import { useEditor } from "../../hooks/useEditor.mjs";
import { useTransform } from "../../hooks/useTransform.mjs";
import { Box } from "../../primitives/Box.mjs";
import { toDomPrecision } from "../../primitives/utils.mjs";
function DefaultSelectionForeground({ bounds, rotation }) {
  const editor = useEditor();
  const rSvg = useRef(null);
  const onlyShape = useValue("only selected shape", () => editor.getOnlySelectedShape(), [editor]);
  const expandOutlineBy = onlyShape ? editor.getShapeUtil(onlyShape).expandSelectionOutlinePx(onlyShape) : 0;
  useTransform(rSvg, bounds?.x, bounds?.y, 1, rotation, {
    x: -expandOutlineBy,
    y: -expandOutlineBy
  });
  bounds = expandOutlineBy instanceof Box ? bounds.clone().expand(expandOutlineBy).zeroFix() : bounds.clone().expandBy(expandOutlineBy).zeroFix();
  return /* @__PURE__ */ jsx(
    "svg",
    {
      ref: rSvg,
      className: "tl-overlays__item tl-selection__fg",
      "data-testid": "selection-foreground",
      children: /* @__PURE__ */ jsx(
        "rect",
        {
          className: classNames("tl-selection__fg__outline"),
          width: toDomPrecision(bounds.width),
          height: toDomPrecision(bounds.height)
        }
      )
    }
  );
}
export {
  DefaultSelectionForeground
};
//# sourceMappingURL=DefaultSelectionForeground.mjs.map
