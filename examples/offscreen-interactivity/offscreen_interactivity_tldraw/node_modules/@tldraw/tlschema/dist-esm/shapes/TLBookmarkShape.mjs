import { T } from "@tldraw/validate";
import { assetIdValidator } from "../assets/TLBaseAsset.mjs";
import { createShapePropsMigrationIds, createShapePropsMigrationSequence } from "../records/TLShape.mjs";
const bookmarkShapeProps = {
  w: T.nonZeroNumber,
  h: T.nonZeroNumber,
  assetId: assetIdValidator.nullable(),
  url: T.linkUrl
};
const Versions = createShapePropsMigrationIds("bookmark", {
  NullAssetId: 1,
  MakeUrlsValid: 2
});
const bookmarkShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: Versions.NullAssetId,
      up: (props) => {
        if (props.assetId === void 0) {
          props.assetId = null;
        }
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
    }
  ]
});
export {
  bookmarkShapeMigrations,
  bookmarkShapeProps,
  Versions as bookmarkShapeVersions
};
//# sourceMappingURL=TLBookmarkShape.mjs.map
