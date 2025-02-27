import { createMigrationIds, createRecordMigrationSequence } from "@tldraw/store";
import { T } from "@tldraw/validate";
import { createAssetValidator } from "./TLBaseAsset.mjs";
const videoAssetValidator = createAssetValidator(
  "video",
  T.object({
    w: T.number,
    h: T.number,
    name: T.string,
    isAnimated: T.boolean,
    mimeType: T.string.nullable(),
    src: T.srcUrl.nullable(),
    fileSize: T.number.optional()
  })
);
const Versions = createMigrationIds("com.tldraw.asset.video", {
  AddIsAnimated: 1,
  RenameWidthHeight: 2,
  MakeUrlsValid: 3,
  AddFileSize: 4,
  MakeFileSizeOptional: 5
});
const videoAssetMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.asset.video",
  recordType: "asset",
  filter: (asset) => asset.type === "video",
  sequence: [
    {
      id: Versions.AddIsAnimated,
      up: (asset) => {
        asset.props.isAnimated = false;
      },
      down: (asset) => {
        delete asset.props.isAnimated;
      }
    },
    {
      id: Versions.RenameWidthHeight,
      up: (asset) => {
        asset.props.w = asset.props.width;
        asset.props.h = asset.props.height;
        delete asset.props.width;
        delete asset.props.height;
      },
      down: (asset) => {
        asset.props.width = asset.props.w;
        asset.props.height = asset.props.h;
        delete asset.props.w;
        delete asset.props.h;
      }
    },
    {
      id: Versions.MakeUrlsValid,
      up: (asset) => {
        if (!T.srcUrl.isValid(asset.props.src)) {
          asset.props.src = "";
        }
      },
      down: (_asset) => {
      }
    },
    {
      id: Versions.AddFileSize,
      up: (asset) => {
        asset.props.fileSize = -1;
      },
      down: (asset) => {
        delete asset.props.fileSize;
      }
    },
    {
      id: Versions.MakeFileSizeOptional,
      up: (asset) => {
        if (asset.props.fileSize === -1) {
          asset.props.fileSize = void 0;
        }
      },
      down: (asset) => {
        if (asset.props.fileSize === void 0) {
          asset.props.fileSize = -1;
        }
      }
    }
  ]
});
export {
  videoAssetMigrations,
  videoAssetValidator,
  Versions as videoAssetVersions
};
//# sourceMappingURL=TLVideoAsset.mjs.map
