import { jsx } from "react/jsx-runtime";
import classNames from "classnames";
import { cloneElement, memo, useLayoutEffect, useRef } from "react";
import { useAssetUrls } from "../../context/asset-urls.mjs";
const TldrawUiIcon = memo(function TldrawUiIcon2({
  label,
  small,
  invertIcon,
  icon,
  color,
  className,
  ...props
}) {
  if (typeof icon === "string") {
    return /* @__PURE__ */ jsx(
      TldrawUIIconInner,
      {
        label,
        small,
        invertIcon,
        icon,
        color,
        className,
        ...props
      }
    );
  }
  return cloneElement(icon, {
    ...props,
    className: classNames({ "tlui-icon__small": small }, className, icon.props.className),
    "aria-label": label,
    style: {
      color,
      transform: invertIcon ? "scale(-1, 1)" : void 0,
      ...icon.props.style
    }
  });
});
function TldrawUIIconInner({
  label,
  small,
  invertIcon,
  icon,
  color,
  className,
  ...props
}) {
  const assetUrls = useAssetUrls();
  const asset = assetUrls.icons[icon] ?? assetUrls.icons["question-mark-circle"];
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!asset) {
      console.error(`Icon not found: ${icon}. Add it to the assetUrls.icons object.`);
    }
    if (ref?.current) {
      ref.current.style.webkitMask = `url(${asset}) center 100% / 100% no-repeat`;
    }
  }, [ref, asset, icon]);
  if (icon === "none") {
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: classNames(
          "tlui-icon tlui-icon__placeholder",
          { "tlui-icon__small": small },
          className
        ),
        ...props
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      ...props,
      ref,
      "aria-label": label,
      role: "img",
      className: classNames("tlui-icon", { "tlui-icon__small": small }, className),
      style: {
        color,
        mask: `url(${asset}) center 100% / 100% no-repeat`,
        transform: invertIcon ? "scale(-1, 1)" : void 0
      }
    }
  );
}
export {
  TldrawUiIcon
};
//# sourceMappingURL=TldrawUiIcon.mjs.map
