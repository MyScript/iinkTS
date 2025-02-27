import { useLayoutEffect } from "react";
function useTransform(ref, x, y, scale, rotate, additionalOffset) {
  useLayoutEffect(() => {
    const elm = ref.current;
    if (!elm) return;
    if (x === void 0) return;
    let trans = `translate(${x}px, ${y}px)`;
    if (scale !== void 0) {
      trans += ` scale(${scale})`;
    }
    if (rotate !== void 0) {
      trans += ` rotate(${rotate}rad)`;
    }
    if (additionalOffset) {
      trans += ` translate(${additionalOffset.x}px, ${additionalOffset.y}px)`;
    }
    elm.style.transform = trans;
  });
}
export {
  useTransform
};
//# sourceMappingURL=useTransform.mjs.map
