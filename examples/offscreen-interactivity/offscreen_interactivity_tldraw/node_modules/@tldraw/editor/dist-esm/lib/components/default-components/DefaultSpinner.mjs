import { jsx, jsxs } from "react/jsx-runtime";
import classNames from "classnames";
function DefaultSpinner(props) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: 16,
      height: 16,
      viewBox: "0 0 16 16",
      "aria-hidden": "false",
      ...props,
      className: classNames("tl-spinner", props.className),
      children: /* @__PURE__ */ jsxs("g", { strokeWidth: 2, fill: "none", fillRule: "evenodd", children: [
        /* @__PURE__ */ jsx("circle", { strokeOpacity: 0.25, cx: 8, cy: 8, r: 7, stroke: "currentColor" }),
        /* @__PURE__ */ jsx("path", { strokeLinecap: "round", d: "M15 8c0-4.5-4.5-7-7-7", stroke: "currentColor" })
      ] })
    }
  );
}
export {
  DefaultSpinner
};
//# sourceMappingURL=DefaultSpinner.mjs.map
