import { jsx } from "react/jsx-runtime";
import classNames from "classnames";
function SVGContainer({ children, className = "", ...rest }) {
  return /* @__PURE__ */ jsx("svg", { ...rest, className: classNames("tl-svg-container", className), "aria-hidden": "true", children });
}
export {
  SVGContainer
};
//# sourceMappingURL=SVGContainer.mjs.map
