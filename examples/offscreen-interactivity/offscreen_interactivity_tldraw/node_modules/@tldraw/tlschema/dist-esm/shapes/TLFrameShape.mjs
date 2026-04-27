import { T } from "@tldraw/validate";
import { createShapePropsMigrationIds, createShapePropsMigrationSequence } from "../records/TLShape.mjs";
import { DefaultColorStyle } from "../styles/TLColorStyle.mjs";
const frameShapeProps = {
  w: T.nonZeroNumber,
  h: T.nonZeroNumber,
  name: T.string,
  // because shape colors are an option, we don't want them to be picked up by the editor as a
  // style prop by default, so instead of a proper style we just supply an equivalent validator.
  // Check `FrameShapeUtil.configure` for how we replace this with the original
  // `DefaultColorStyle` style when the option is turned on.
  color: T.literalEnum(...DefaultColorStyle.values)
};
const Versions = createShapePropsMigrationIds("frame", {
  AddColorProp: 1
});
const frameShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions.AddColorProp,
      up: (props) => {
        props.color = "black";
      },
      down: (props) => {
        delete props.color;
      }
    }
  ]
});
export {
  frameShapeMigrations,
  frameShapeProps,
  Versions as frameShapeVersions
};
//# sourceMappingURL=TLFrameShape.mjs.map
