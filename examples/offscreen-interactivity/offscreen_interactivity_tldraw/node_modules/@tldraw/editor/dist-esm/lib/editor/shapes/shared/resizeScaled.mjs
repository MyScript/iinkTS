import { exhaustiveSwitchError } from "@tldraw/utils";
import { Vec } from "../../../primitives/Vec.mjs";
function resizeScaled(shape, { initialBounds, scaleX, scaleY, newPoint, handle }) {
  let scaleDelta;
  switch (handle) {
    case "bottom_left":
    case "bottom_right":
    case "top_left":
    case "top_right": {
      scaleDelta = Math.max(0.01, Math.max(Math.abs(scaleX), Math.abs(scaleY)));
      break;
    }
    case "left":
    case "right": {
      scaleDelta = Math.max(0.01, Math.abs(scaleX));
      break;
    }
    case "bottom":
    case "top": {
      scaleDelta = Math.max(0.01, Math.abs(scaleY));
      break;
    }
    default: {
      throw exhaustiveSwitchError(handle);
    }
  }
  const offset = new Vec(0, 0);
  if (scaleX < 0) {
    offset.x = -(initialBounds.width * scaleDelta);
  }
  if (scaleY < 0) {
    offset.y = -(initialBounds.height * scaleDelta);
  }
  const { x, y } = Vec.Add(newPoint, offset.rot(shape.rotation));
  return {
    x,
    y,
    props: {
      scale: scaleDelta * shape.props.scale
    }
  };
}
export {
  resizeScaled
};
//# sourceMappingURL=resizeScaled.mjs.map
