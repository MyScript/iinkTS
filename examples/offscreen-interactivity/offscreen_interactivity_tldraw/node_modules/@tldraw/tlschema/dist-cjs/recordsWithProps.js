"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var recordsWithProps_exports = {};
__export(recordsWithProps_exports, {
  createPropsMigration: () => createPropsMigration,
  processPropsMigrations: () => processPropsMigrations
});
module.exports = __toCommonJS(recordsWithProps_exports);
var import_store = require("@tldraw/store");
var import_utils = require("@tldraw/utils");
function processPropsMigrations(typeName, records) {
  const result = [];
  for (const [subType, { migrations }] of Object.entries(records)) {
    const sequenceId = `com.tldraw.${typeName}.${subType}`;
    if (!migrations) {
      result.push(
        (0, import_store.createMigrationSequence)({
          sequenceId,
          retroactive: true,
          sequence: []
        })
      );
    } else if ("sequenceId" in migrations) {
      (0, import_utils.assert)(
        sequenceId === migrations.sequenceId,
        `sequenceId mismatch for ${subType} ${import_store.RecordType} migrations. Expected '${sequenceId}', got '${migrations.sequenceId}'`
      );
      result.push(migrations);
    } else if ("sequence" in migrations) {
      result.push(
        (0, import_store.createMigrationSequence)({
          sequenceId,
          retroactive: true,
          sequence: migrations.sequence.map(
            (m) => "id" in m ? createPropsMigration(typeName, subType, m) : m
          )
        })
      );
    } else {
      result.push(
        (0, import_store.createMigrationSequence)({
          sequenceId,
          retroactive: true,
          sequence: Object.keys(migrations.migrators).map((k) => Number(k)).sort((a, b) => a - b).map(
            (version) => ({
              id: `${sequenceId}/${version}`,
              scope: "record",
              filter: (r) => r.typeName === typeName && r.type === subType,
              up: (record) => {
                const result2 = migrations.migrators[version].up(record);
                if (result2) {
                  return result2;
                }
              },
              down: (record) => {
                const result2 = migrations.migrators[version].down(record);
                if (result2) {
                  return result2;
                }
              }
            })
          )
        })
      );
    }
  }
  return result;
}
function createPropsMigration(typeName, subType, m) {
  return {
    id: m.id,
    dependsOn: m.dependsOn,
    scope: "record",
    filter: (r) => r.typeName === typeName && r.type === subType,
    up: (record) => {
      const result = m.up(record.props);
      if (result) {
        record.props = result;
      }
    },
    down: typeof m.down === "function" ? (record) => {
      const result = m.down(record.props);
      if (result) {
        record.props = result;
      }
    } : void 0
  };
}
//# sourceMappingURL=recordsWithProps.js.map
