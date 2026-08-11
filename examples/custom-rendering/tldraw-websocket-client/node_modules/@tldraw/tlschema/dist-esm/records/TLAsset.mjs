import {
  createMigrationIds,
  createRecordMigrationSequence,
  createRecordType
} from "@tldraw/store";
import { T } from "@tldraw/validate";
import { bookmarkAssetValidator } from "../assets/TLBookmarkAsset.mjs";
import { imageAssetValidator } from "../assets/TLImageAsset.mjs";
import { videoAssetValidator } from "../assets/TLVideoAsset.mjs";
const assetValidator = T.model(
  "asset",
  T.union("type", {
    image: imageAssetValidator,
    video: videoAssetValidator,
    bookmark: bookmarkAssetValidator
  })
);
const assetVersions = createMigrationIds("com.tldraw.asset", {
  AddMeta: 1
});
const assetMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.asset",
  recordType: "asset",
  sequence: [
    {
      id: assetVersions.AddMeta,
      up: (record) => {
        ;
        record.meta = {};
      }
    }
  ]
});
const AssetRecordType = createRecordType("asset", {
  validator: assetValidator,
  scope: "document"
}).withDefaultProperties(() => ({
  meta: {}
}));
export {
  AssetRecordType,
  assetMigrations,
  assetValidator,
  assetVersions
};
//# sourceMappingURL=TLAsset.mjs.map
