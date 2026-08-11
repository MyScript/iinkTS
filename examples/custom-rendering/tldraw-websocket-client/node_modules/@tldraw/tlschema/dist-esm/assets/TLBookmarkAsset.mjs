import { createMigrationIds, createRecordMigrationSequence } from "@tldraw/store";
import { T } from "@tldraw/validate";
import { createAssetValidator } from "./TLBaseAsset.mjs";
const bookmarkAssetValidator = createAssetValidator(
  "bookmark",
  T.object({
    title: T.string,
    description: T.string,
    image: T.string,
    favicon: T.string,
    src: T.srcUrl.nullable()
  })
);
const Versions = createMigrationIds("com.tldraw.asset.bookmark", {
  MakeUrlsValid: 1,
  AddFavicon: 2
});
const bookmarkAssetMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.asset.bookmark",
  recordType: "asset",
  filter: (asset) => asset.type === "bookmark",
  sequence: [
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
      id: Versions.AddFavicon,
      up: (asset) => {
        if (!T.srcUrl.isValid(asset.props.favicon)) {
          asset.props.favicon = "";
        }
      },
      down: (asset) => {
        delete asset.props.favicon;
      }
    }
  ]
});
export {
  bookmarkAssetMigrations,
  bookmarkAssetValidator,
  Versions as bookmarkAssetVersions
};
//# sourceMappingURL=TLBookmarkAsset.mjs.map
