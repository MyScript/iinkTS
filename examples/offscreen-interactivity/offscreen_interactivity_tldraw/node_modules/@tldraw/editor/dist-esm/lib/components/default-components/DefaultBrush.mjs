import { jsx, jsxs } from "react/jsx-runtime";
import { useRef } from "react";
import { useTransform } from "../../hooks/useTransform.mjs";
import { toDomPrecision } from "../../primitives/utils.mjs";
const DefaultBrush = ({ brush, color, opacity, className }) => {
  const rSvg = useRef(null);
  useTransform(rSvg, brush.x, brush.y);
  const w = toDomPrecision(Math.max(1, brush.w));
  const h = toDomPrecision(Math.max(1, brush.h));
  return /* @__PURE__ */ jsx("svg", { className: "tl-overlays__item", ref: rSvg, "aria-hidden": "true", children: color ? /* @__PURE__ */ jsxs("g", { className: "tl-brush", opacity, children: [
    /* @__PURE__ */ jsx("rect", { width: w, height: h, fill: color, opacity: 0.75 }),
    /* @__PURE__ */ jsx("rect", { width: w, height: h, fill: "none", stroke: color, opacity: 0.1 })
  ] }) : /* @__PURE__ */ jsx("rect", { className: `tl-brush tl-brush__default ${className}`, width: w, height: h }) });
};
export {
  DefaultBrush
};
//# sourceMappingURL=DefaultBrush.mjs.map
