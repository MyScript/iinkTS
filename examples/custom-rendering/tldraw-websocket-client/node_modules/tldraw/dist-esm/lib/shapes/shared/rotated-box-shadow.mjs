import { Vec } from "@tldraw/editor";
const ROTATING_BOX_SHADOWS = [
  {
    offsetX: 0,
    offsetY: 2,
    blur: 4,
    spread: 0,
    color: "#00000029"
  },
  {
    offsetX: 0,
    offsetY: 3,
    blur: 6,
    spread: 0,
    color: "#0000001f"
  }
];
function getRotatedBoxShadow(rotation) {
  const cssStrings = ROTATING_BOX_SHADOWS.map((shadow) => {
    const { offsetX, offsetY, blur, spread, color } = shadow;
    const vec = new Vec(offsetX, offsetY);
    const { x, y } = vec.rot(-rotation);
    return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
  });
  return cssStrings.join(", ");
}
export {
  getRotatedBoxShadow
};
//# sourceMappingURL=rotated-box-shadow.mjs.map
