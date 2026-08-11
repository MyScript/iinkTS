import {
  createMigrationIds,
  createRecordMigrationSequence,
  createRecordType
} from "@tldraw/store";
import { T } from "@tldraw/validate";
import { idValidator } from "../misc/id-validator.mjs";
const cameraValidator = T.model(
  "camera",
  T.object({
    typeName: T.literal("camera"),
    id: idValidator("camera"),
    x: T.number,
    y: T.number,
    z: T.number,
    meta: T.jsonValue
  })
);
const cameraVersions = createMigrationIds("com.tldraw.camera", {
  AddMeta: 1
});
const cameraMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.camera",
  recordType: "camera",
  sequence: [
    {
      id: cameraVersions.AddMeta,
      up: (record) => {
        ;
        record.meta = {};
      }
    }
  ]
});
const CameraRecordType = createRecordType("camera", {
  validator: cameraValidator,
  scope: "session"
}).withDefaultProperties(
  () => ({
    x: 0,
    y: 0,
    z: 1,
    meta: {}
  })
);
export {
  CameraRecordType,
  cameraMigrations,
  cameraValidator,
  cameraVersions
};
//# sourceMappingURL=TLCamera.mjs.map
