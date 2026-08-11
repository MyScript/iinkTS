import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import classNames from "classnames";
import { memo, useRef } from "react";
import { useSharedSafeId } from "../../hooks/useSafeId.mjs";
import { useTransform } from "../../hooks/useTransform.mjs";
const DefaultCursor = memo(function DefaultCursor2({
  className,
  zoom,
  point,
  color,
  name,
  chatMessage
}) {
  const rCursor = useRef(null);
  useTransform(rCursor, point?.x, point?.y, 1 / zoom);
  const cursorId = useSharedSafeId("cursor");
  if (!point) return null;
  return /* @__PURE__ */ jsxs("div", { ref: rCursor, className: classNames("tl-overlays__item", className), children: [
    /* @__PURE__ */ jsx("svg", { className: "tl-cursor", "aria-hidden": "true", children: /* @__PURE__ */ jsx("use", { href: `#${cursorId}`, color }) }),
    chatMessage ? /* @__PURE__ */ jsxs(Fragment, { children: [
      name && /* @__PURE__ */ jsx("div", { className: "tl-nametag-title", style: { color }, children: name }),
      /* @__PURE__ */ jsx("div", { className: "tl-nametag-chat", style: { backgroundColor: color }, children: chatMessage })
    ] }) : name && /* @__PURE__ */ jsx("div", { className: "tl-nametag", style: { backgroundColor: color }, children: name })
  ] });
});
export {
  DefaultCursor
};
//# sourceMappingURL=DefaultCursor.mjs.map
