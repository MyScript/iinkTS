import { jsx } from "react/jsx-runtime";
import classNames from "classnames";
function HTMLContainer({ children, className = "", ...rest }) {
  return /* @__PURE__ */ jsx("div", { ...rest, className: classNames("tl-html-container", className), children });
}
export {
  HTMLContainer
};
//# sourceMappingURL=HTMLContainer.mjs.map
