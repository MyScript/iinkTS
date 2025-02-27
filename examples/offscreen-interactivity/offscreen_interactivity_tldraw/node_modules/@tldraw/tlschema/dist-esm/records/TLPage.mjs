import {
  createMigrationIds,
  createRecordMigrationSequence,
  createRecordType
} from "@tldraw/store";
import { T } from "@tldraw/validate";
import { idValidator } from "../misc/id-validator.mjs";
const pageIdValidator = idValidator("page");
const pageValidator = T.model(
  "page",
  T.object({
    typeName: T.literal("page"),
    id: pageIdValidator,
    name: T.string,
    index: T.indexKey,
    meta: T.jsonValue
  })
);
const pageVersions = createMigrationIds("com.tldraw.page", {
  AddMeta: 1
});
const pageMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.page",
  recordType: "page",
  sequence: [
    {
      id: pageVersions.AddMeta,
      up: (record) => {
        record.meta = {};
      }
    }
  ]
});
const PageRecordType = createRecordType("page", {
  validator: pageValidator,
  scope: "document"
}).withDefaultProperties(() => ({
  meta: {}
}));
function isPageId(id) {
  return PageRecordType.isId(id);
}
export {
  PageRecordType,
  isPageId,
  pageIdValidator,
  pageMigrations,
  pageValidator,
  pageVersions
};
//# sourceMappingURL=TLPage.mjs.map
