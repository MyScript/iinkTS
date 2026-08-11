import { ArrowShapeUtil } from "./shapes/arrow/ArrowShapeUtil.mjs";
import { BookmarkShapeUtil } from "./shapes/bookmark/BookmarkShapeUtil.mjs";
import { DrawShapeUtil } from "./shapes/draw/DrawShapeUtil.mjs";
import { EmbedShapeUtil } from "./shapes/embed/EmbedShapeUtil.mjs";
import { FrameShapeUtil } from "./shapes/frame/FrameShapeUtil.mjs";
import { GeoShapeUtil } from "./shapes/geo/GeoShapeUtil.mjs";
import { HighlightShapeUtil } from "./shapes/highlight/HighlightShapeUtil.mjs";
import { ImageShapeUtil } from "./shapes/image/ImageShapeUtil.mjs";
import { LineShapeUtil } from "./shapes/line/LineShapeUtil.mjs";
import { NoteShapeUtil } from "./shapes/note/NoteShapeUtil.mjs";
import { TextShapeUtil } from "./shapes/text/TextShapeUtil.mjs";
import { VideoShapeUtil } from "./shapes/video/VideoShapeUtil.mjs";
const defaultShapeUtils = [
  TextShapeUtil,
  BookmarkShapeUtil,
  DrawShapeUtil,
  GeoShapeUtil,
  NoteShapeUtil,
  LineShapeUtil,
  FrameShapeUtil,
  ArrowShapeUtil,
  HighlightShapeUtil,
  EmbedShapeUtil,
  ImageShapeUtil,
  VideoShapeUtil
];
export {
  defaultShapeUtils
};
//# sourceMappingURL=defaultShapeUtils.mjs.map
