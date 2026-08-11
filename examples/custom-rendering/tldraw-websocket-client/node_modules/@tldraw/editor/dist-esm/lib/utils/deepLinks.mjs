import { PageRecordType, createShapeId } from "@tldraw/tlschema";
import { exhaustiveSwitchError } from "@tldraw/utils";
import { Box } from "../primitives/Box.mjs";
function createDeepLinkString(deepLink) {
  switch (deepLink.type) {
    case "shapes": {
      const ids = deepLink.shapeIds.map((id) => encodeId(id.slice("shape:".length)));
      return `s${ids.join(".")}`;
    }
    case "page": {
      return "p" + encodeId(PageRecordType.parseId(deepLink.pageId));
    }
    case "viewport": {
      const { bounds, pageId } = deepLink;
      let res = `v${Math.round(bounds.x)}.${Math.round(bounds.y)}.${Math.round(bounds.w)}.${Math.round(bounds.h)}`;
      if (pageId) {
        res += "." + encodeId(PageRecordType.parseId(pageId));
      }
      return res;
    }
    default:
      exhaustiveSwitchError(deepLink);
  }
}
function parseDeepLinkString(deepLinkString) {
  const type = deepLinkString[0];
  switch (type) {
    case "s": {
      const shapeIds = deepLinkString.slice(1).split(".").filter(Boolean).map((id) => createShapeId(decodeURIComponent(id)));
      return { type: "shapes", shapeIds };
    }
    case "p": {
      const pageId = PageRecordType.createId(decodeURIComponent(deepLinkString.slice(1)));
      return { type: "page", pageId };
    }
    case "v": {
      const [x, y, w, h, pageId] = deepLinkString.slice(1).split(".");
      return {
        type: "viewport",
        bounds: new Box(Number(x), Number(y), Number(w), Number(h)),
        pageId: pageId ? PageRecordType.createId(decodeURIComponent(pageId)) : void 0
      };
    }
    default:
      throw Error("Invalid deep link string");
  }
}
function encodeId(str) {
  return encodeURIComponent(str).replace(/\./g, "%2E");
}
export {
  createDeepLinkString,
  parseDeepLinkString
};
//# sourceMappingURL=deepLinks.mjs.map
