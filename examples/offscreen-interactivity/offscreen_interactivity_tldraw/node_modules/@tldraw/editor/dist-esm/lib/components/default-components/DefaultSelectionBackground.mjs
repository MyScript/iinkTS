import { jsx } from "react/jsx-runtime";
import * as React from "react";
import { useTransform } from "../../hooks/useTransform.mjs";
import { toDomPrecision } from "../../primitives/utils.mjs";
function DefaultSelectionBackground({ bounds, rotation }) {
  const rDiv = React.useRef(null);
  useTransform(rDiv, bounds.x, bounds.y, 1, rotation);
  React.useLayoutEffect(() => {
    const div = rDiv.current;
    if (!div) return;
    div.style.width = toDomPrecision(Math.max(1, bounds.width)) + "px";
    div.style.height = toDomPrecision(Math.max(1, bounds.height)) + "px";
  }, [bounds.width, bounds.height]);
  return /* @__PURE__ */ jsx("div", { ref: rDiv, className: "tl-selection__bg", draggable: false });
}
export {
  DefaultSelectionBackground
};
//# sourceMappingURL=DefaultSelectionBackground.mjs.map
