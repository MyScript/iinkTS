import { lerp } from "@tldraw/utils";
import { Rectangle2d } from "../../primitives/geometry/Rectangle2d.mjs";
import { ShapeUtil } from "./ShapeUtil.mjs";
import { resizeBox } from "./shared/resizeBox.mjs";
class BaseBoxShapeUtil extends ShapeUtil {
  getGeometry(shape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true
    });
  }
  onResize(shape, info) {
    return resizeBox(shape, info);
  }
  getHandleSnapGeometry(shape) {
    return {
      points: this.getGeometry(shape).bounds.cornersAndCenter
    };
  }
  getInterpolatedProps(startShape, endShape, t) {
    return {
      ...endShape.props,
      w: lerp(startShape.props.w, endShape.props.w, t),
      h: lerp(startShape.props.h, endShape.props.h, t)
    };
  }
}
export {
  BaseBoxShapeUtil
};
//# sourceMappingURL=BaseBoxShapeUtil.mjs.map
