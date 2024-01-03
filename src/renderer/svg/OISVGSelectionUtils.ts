import { LoggerClass, SELECTION_MARGIN, ResizeDirection, SvgElementRole } from "../../Constants"
import { LoggerManager } from "../../logger"
import { SymbolType, TBoundingBox, TPoint } from "../../primitive"
import { StyleHelper } from "../../style"

import { createCircle, createGroup, createLine, createRect } from "./SVGElementBuilder"

export class OISVGSelectionUtils
{
  #logger = LoggerManager.getLogger(LoggerClass.RENDERER)

  selectionFilterId: string

  constructor(selectionFilterId: string)
  {
    this.selectionFilterId = selectionFilterId
  }

  getSelectingRect(box: TBoundingBox): SVGRectElement
  {
    const attrs = {
      fill: "transparent",
      stroke: "grey",
      opacity: "0.25",
      role: SvgElementRole.Selecting
    }
    return createRect(box, attrs)
  }

  protected createTranslateRect(box: TBoundingBox): SVGRectElement
  {
    const attrs = {
      style: "cursor:move",
      fill: "transparent",
      stroke: "transparent",
      role: SvgElementRole.Translate
    }
    const boxWithMarge: TBoundingBox = {
      height: box.height + 2 * SELECTION_MARGIN,
      width: box.width + 2 * SELECTION_MARGIN,
      x: box.x - SELECTION_MARGIN,
      y: box.y - SELECTION_MARGIN
    }
    return createRect(boxWithMarge, attrs)
  }

  protected createRotateGroup(box: TBoundingBox): SVGGElement
  {
    const group = createGroup()
    const radius = 8
    const center: TPoint = {
      x: (box.x + box.width / 2),
      y: box.y - 20
    }
    const attrs1 = {
      "vector-effect": "non-scaling-stroke",
      style: "cursor:pointer;",
      opacity: "1",
      stroke: "black",
      "stroke-width": "2",
      fill: "white",
      role: SvgElementRole.Rotate
    }
    group.appendChild(createCircle(center, radius, attrs1))

    const attrs2 = {
      "vector-effect": "non-scaling-stroke",
      style: "cursor:pointer;",
      opacity: "1",
      fill: "black",
      role: SvgElementRole.Rotate
    }
    group.appendChild(createCircle(center, radius / 2, attrs2))
    return group
  }

  protected createResizeGroup(box: TBoundingBox): SVGGElement
  {
    const group = createGroup()
    const P_NW: TPoint = { x: box.x - SELECTION_MARGIN, y: box.y - SELECTION_MARGIN }
    const P_NE: TPoint = { x: box.x + box.width + SELECTION_MARGIN, y: box.y - SELECTION_MARGIN }
    const P_SE: TPoint = { x: box.x + box.width + SELECTION_MARGIN, y: box.y + box.height + SELECTION_MARGIN }
    const P_SW: TPoint = { x: box.x - SELECTION_MARGIN, y: box.y + box.height + SELECTION_MARGIN }

    const sideResizeDefs = [
      { direction: ResizeDirection.North, p1: P_NW, p2: P_NE },
      { direction: ResizeDirection.East, p1: P_NE, p2: P_SE },
      { direction: ResizeDirection.South, p1: P_SW, p2: P_SE },
      { direction: ResizeDirection.West, p1: P_NW, p2: P_SW },
    ]
    sideResizeDefs.forEach(def =>
    {
      const attrs = {
        "vector-effect": "non-scaling-stroke",
        "stroke-width": "4",
        role: SvgElementRole.Resize,
        "resize-direction": def.direction,
        stroke: "#1A9FFF",
        style: `cursor:${ def.direction };`
      }
      group.appendChild(createLine(def.p1, def.p2, attrs))
    })
    const cornerResizeDefs = [
      { direction: ResizeDirection.NorthWest, p: P_NW },
      { direction: ResizeDirection.NorthEast, p: P_NE },
      { direction: ResizeDirection.SouthEast, p: P_SE },
      { direction: ResizeDirection.SouthWest, p: P_SW },
    ]
    cornerResizeDefs.forEach(def =>
    {
      const attrs = {
        "vector-effect": "non-scaling-stroke",
        "stroke-width": "4",
        role: SvgElementRole.Resize,
        "resize-direction": def.direction,
        stroke: "#1A9FFF",
        fill: "white",
        style: `cursor:${ def.direction };`
      }
      group.appendChild(createCircle(def.p, 5, attrs))
    })
    return group
  }

  protected createSelectedGroup(box: TBoundingBox): SVGGElement
  {
    const attrs = {
      id: `selected-${ Date.now() }`,
      role: SvgElementRole.Selected,
      "origin-y": box.y.toString(),
      "origin-x": box.x.toString(),
      "origin-height": box.height.toString(),
      "origin-width": box.width.toString(),

    }
    const surroundGroup = createGroup(attrs)
    surroundGroup.appendChild(this.createResizeGroup(box))
    surroundGroup.appendChild(this.createTranslateRect(box))
    surroundGroup.appendChild(this.createRotateGroup(box))
    return surroundGroup
  }

  wrapElements(elements: SVGGeometryElement[]): SVGGElement | undefined
  {
    this.#logger.info("drawSelectedGroup", { elements })

    if (!elements.length) return

    const pathBoxList = elements.map(p => p.getBBox())
    const maxCoordinates = {
      top: Math.min(...pathBoxList.map(b => b.y)),
      bottom: Math.max(...pathBoxList.map(b => b.y + b.height)),
      left: Math.min(...pathBoxList.map(b => b.x)),
      right: Math.max(...pathBoxList.map(b => b.x + b.width)),
    }
    const bboxRect = {
      x: maxCoordinates.left,
      width: maxCoordinates.right - maxCoordinates.left,
      y: maxCoordinates.top,
      height: maxCoordinates.bottom - maxCoordinates.top,
    }

    const surroundGroup = this.createSelectedGroup(bboxRect)
    elements.forEach(el => el.setAttribute("filter", `url(#${ this.selectionFilterId })`))

    elements.forEach(s => s.setAttribute("style", "pointer-events:none;" + s.getAttribute("style")))
    if (surroundGroup) {
      elements[0].insertAdjacentElement("beforebegin", surroundGroup)
      const pathRectAttrs = {
        style: "pointer-events: none",
        fill: "transparent",
        stroke: "#1A9FFF",
        "vector-effect": "non-scaling-stroke",
        "stroke-width": "2",
      }
      const needDisplayPathSelection = elements.length > 1
      elements.forEach(p =>
      {
        if (needDisplayPathSelection) {
          surroundGroup.appendChild(createRect(p.getBBox(), pathRectAttrs))
        }
        surroundGroup.appendChild(p)
      })
    }
    return surroundGroup
  }

  unWrap(group: SVGGElement): void
  {
    const querySymbols = Object.values(SymbolType).map(v => `[type=${ v }]`).join(",")
    group.querySelectorAll(querySymbols)
    .forEach(s =>
    {
      const style = s.getAttribute("style") as string
      const styleJson = StyleHelper.stringToJSON(style)
      styleJson["pointer-events"] = "stroke;"
      // delete styleJson["pointer-events"]
      s.setAttribute("style", StyleHelper.JSONToString(styleJson))
      s.removeAttribute("filter")
      group.insertAdjacentElement("beforebegin", s)
    })
    group.remove()
  }
}
