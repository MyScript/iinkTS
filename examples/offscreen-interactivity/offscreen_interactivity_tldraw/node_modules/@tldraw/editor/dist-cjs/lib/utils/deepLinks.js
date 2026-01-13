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
var deepLinks_exports = {};
__export(deepLinks_exports, {
  createDeepLinkString: () => createDeepLinkString,
  parseDeepLinkString: () => parseDeepLinkString
});
module.exports = __toCommonJS(deepLinks_exports);
var import_tlschema = require("@tldraw/tlschema");
var import_utils = require("@tldraw/utils");
var import_Box = require("../primitives/Box");
function createDeepLinkString(deepLink) {
  switch (deepLink.type) {
    case "shapes": {
      const ids = deepLink.shapeIds.map((id) => encodeId(id.slice("shape:".length)));
      return `s${ids.join(".")}`;
    }
    case "page": {
      return "p" + encodeId(import_tlschema.PageRecordType.parseId(deepLink.pageId));
    }
    case "viewport": {
      const { bounds, pageId } = deepLink;
      let res = `v${Math.round(bounds.x)}.${Math.round(bounds.y)}.${Math.round(bounds.w)}.${Math.round(bounds.h)}`;
      if (pageId) {
        res += "." + encodeId(import_tlschema.PageRecordType.parseId(pageId));
      }
      return res;
    }
    default:
      (0, import_utils.exhaustiveSwitchError)(deepLink);
  }
}
function parseDeepLinkString(deepLinkString) {
  const type = deepLinkString[0];
  switch (type) {
    case "s": {
      const shapeIds = deepLinkString.slice(1).split(".").filter(Boolean).map((id) => (0, import_tlschema.createShapeId)(decodeURIComponent(id)));
      return { type: "shapes", shapeIds };
    }
    case "p": {
      const pageId = import_tlschema.PageRecordType.createId(decodeURIComponent(deepLinkString.slice(1)));
      return { type: "page", pageId };
    }
    case "v": {
      const [x, y, w, h, pageId] = deepLinkString.slice(1).split(".");
      return {
        type: "viewport",
        bounds: new import_Box.Box(Number(x), Number(y), Number(w), Number(h)),
        pageId: pageId ? import_tlschema.PageRecordType.createId(decodeURIComponent(pageId)) : void 0
      };
    }
    default:
      throw Error("Invalid deep link string");
  }
}
function encodeId(str) {
  return encodeURIComponent(str).replace(/\./g, "%2E");
}
//# sourceMappingURL=deepLinks.js.map
