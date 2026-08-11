import { T } from "@tldraw/validate";
import { assetIdValidator } from "../assets/TLBaseAsset.mjs";
import { vecModelValidator } from "../misc/geometry-types.mjs";
import { createShapePropsMigrationIds, createShapePropsMigrationSequence } from "../records/TLShape.mjs";
const ImageShapeCrop = T.object({
  topLeft: vecModelValidator,
  bottomRight: vecModelValidator,
  isCircle: T.boolean.optional()
});
const imageShapeProps = {
  w: T.nonZeroNumber,
  h: T.nonZeroNumber,
  playing: T.boolean,
  url: T.linkUrl,
  assetId: assetIdValidator.nullable(),
  crop: ImageShapeCrop.nullable(),
  flipX: T.boolean,
  flipY: T.boolean,
  altText: T.string
};
const Versions = createShapePropsMigrationIds("image", {
  AddUrlProp: 1,
  AddCropProp: 2,
  MakeUrlsValid: 3,
  AddFlipProps: 4,
  AddAltText: 5
});
const imageShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions.AddUrlProp,
      up: (props) => {
        props.url = "";
      },
      down: "retired"
    },
    {
      id: Versions.AddCropProp,
      up: (props) => {
        props.crop = null;
      },
      down: (props) => {
        delete props.crop;
      }
    },
    {
      id: Versions.MakeUrlsValid,
      up: (props) => {
        if (!T.linkUrl.isValid(props.url)) {
          props.url = "";
        }
      },
      down: (_props) => {
      }
    },
    {
      id: Versions.AddFlipProps,
      up: (props) => {
        props.flipX = false;
        props.flipY = false;
      },
      down: (props) => {
        delete props.flipX;
        delete props.flipY;
      }
    },
    {
      id: Versions.AddAltText,
      up: (props) => {
        props.altText = "";
      },
      down: (props) => {
        delete props.altText;
      }
    }
  ]
});
export {
  ImageShapeCrop,
  imageShapeMigrations,
  imageShapeProps,
  Versions as imageShapeVersions
};
//# sourceMappingURL=TLImageShape.mjs.map
