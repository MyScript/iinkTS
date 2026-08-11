import { T } from "@tldraw/validate";
import { assetIdValidator } from "../assets/TLBaseAsset.mjs";
import { createShapePropsMigrationIds, createShapePropsMigrationSequence } from "../records/TLShape.mjs";
const videoShapeProps = {
  w: T.nonZeroNumber,
  h: T.nonZeroNumber,
  time: T.number,
  playing: T.boolean,
  autoplay: T.boolean,
  url: T.linkUrl,
  assetId: assetIdValidator.nullable(),
  altText: T.string
};
const Versions = createShapePropsMigrationIds("video", {
  AddUrlProp: 1,
  MakeUrlsValid: 2,
  AddAltText: 3,
  AddAutoplay: 4
});
const videoShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions.AddUrlProp,
      up: (props) => {
        props.url = "";
      },
      down: "retired"
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
      id: Versions.AddAltText,
      up: (props) => {
        props.altText = "";
      },
      down: (props) => {
        delete props.altText;
      }
    },
    {
      id: Versions.AddAutoplay,
      up: (props) => {
        props.autoplay = true;
      },
      down: (props) => {
        delete props.autoplay;
      }
    }
  ]
});
export {
  videoShapeMigrations,
  videoShapeProps,
  Versions as videoShapeVersions
};
//# sourceMappingURL=TLVideoShape.mjs.map
