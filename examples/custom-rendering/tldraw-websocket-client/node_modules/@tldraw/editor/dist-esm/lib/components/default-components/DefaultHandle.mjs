import { jsx, jsxs } from "react/jsx-runtime";
import classNames from "classnames";
import { SIDES } from "../../constants.mjs";
import { useEditor } from "../../hooks/useEditor.mjs";
function DefaultHandle({ handle, isCoarse, className, zoom }) {
  const editor = useEditor();
  const br = (isCoarse ? editor.options.coarseHandleRadius : editor.options.handleRadius) / zoom;
  if (handle.type === "clone") {
    const fr2 = 3 / zoom;
    const path = `M0,${-fr2} A${fr2},${fr2} 0 0,1 0,${fr2}`;
    const index = SIDES.indexOf(handle.id);
    return /* @__PURE__ */ jsxs("g", { className: classNames(`tl-handle tl-handle__${handle.type}`, className), children: [
      /* @__PURE__ */ jsx("circle", { className: "tl-handle__bg", r: br }),
      /* @__PURE__ */ jsx("path", { className: "tl-handle__fg", d: path, transform: `rotate(${-90 + 90 * index})` })
    ] });
  }
  const fr = (handle.type === "create" && isCoarse ? 3 : 4) / Math.max(zoom, 0.25);
  return /* @__PURE__ */ jsxs("g", { className: classNames(`tl-handle tl-handle__${handle.type}`, className), children: [
    /* @__PURE__ */ jsx("circle", { className: "tl-handle__bg", r: br }),
    /* @__PURE__ */ jsx("circle", { className: "tl-handle__fg", r: fr })
  ] });
}
export {
  DefaultHandle
};
//# sourceMappingURL=DefaultHandle.mjs.map
