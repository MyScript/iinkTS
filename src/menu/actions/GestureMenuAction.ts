import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { CanvasTool, CanvasWriteTool } from "@/Constants"
import type { TMenuSubMenu } from "@/menu/items/SubMenuItem"
import { SubMenuItem } from "@/menu/items/SubMenuItem"

/** @group Menu */
export type TGestureActionItemsConfig = {
  detect?: boolean
  surround?: boolean
  strikethrough?: boolean
  underline?: boolean
  insert?: boolean
}
/** @group Menu */
export type TGestureActionConfig = boolean | TGestureActionItemsConfig
import gestureIcon from "@/assets/svg/spock-hand-gesture.svg"
import { InsertAction, StrikeThroughAction, SurroundAction, UnderlineAction } from "@/manager"

/**
 * @group Menu
 * @remarks Menu action Gesture - Détection et actions de gestes
 */
export class GestureMenuAction extends SubMenuItem {
  constructor(editor: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TGestureActionItemsConfig) {
    const enabled = (key: keyof TGestureActionItemsConfig) => itemsConfig?.[key] !== false

    const surroundActionValues: {
      label: string
      value: string
    }[] = []
    for (const key in SurroundAction) {
      const value = SurroundAction[key as keyof typeof SurroundAction]
      surroundActionValues.push({
        label: key,
        value,
      })
    }

    const strikeThroughActionValues: {
      label: string
      value: string
    }[] = []
    for (const key in StrikeThroughAction) {
      const value = StrikeThroughAction[key as keyof typeof StrikeThroughAction]
      strikeThroughActionValues.push({
        label: key,
        value,
      })
    }

    const underlineActionValues: {
      label: string
      value: string
    }[] = []
    for (const key in UnderlineAction) {
      const value = UnderlineAction[key as keyof typeof UnderlineAction]
      underlineActionValues.push({
        label: key,
        value,
      })
    }

    const splitActionValues: {
      label: string
      value: string
    }[] = []
    for (const key in InsertAction) {
      const value = InsertAction[key as keyof typeof InsertAction]
      splitActionValues.push({
        label: key,
        value,
      })
    }

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-gesture`,
      label: "Gesture",
      menuTitle: "Gesture",
      icon: gestureIcon,
      position: "right-top",
      items: [],
    }

    if (enabled("detect")) {
      config.items.push({
        type: "checkbox",
        id: `${idPrefix}-gesture-detect`,
        label: "Detect gesture",
        getValue: (editor) => editor.writer.detectGesture,
        setValue: (editor, value) => {
          editor.writer.detectGesture = value
          editor.tool = CanvasTool.Write
          editor.writer.tool = CanvasWriteTool.Pencil
        },
      })
    }

    if (enabled("surround") && editor.configuration.recognition["raw-content"]?.gestures?.includes("surround")) {
      config.items.push({
        type: "select",
        id: `${idPrefix}-gesture-surround`,
        label: "On surround",
        options: surroundActionValues,
        getValue: (editor) => editor.gesture.surroundAction,
        setValue: (editor, value) => {
          editor.gesture.surroundAction = value as SurroundAction
          editor.tool = CanvasTool.Write
          editor.writer.tool = CanvasWriteTool.Pencil
        },
      })
    }

    if (
      enabled("strikethrough") &&
      editor.configuration.recognition["raw-content"]?.gestures?.includes("strike-through")
    ) {
      config.items.push({
        type: "select",
        id: `${idPrefix}-gesture-strikethrough`,
        label: "On strikethrough",
        options: strikeThroughActionValues,
        getValue: (editor) => editor.gesture.strikeThroughAction,
        setValue: (editor, value) => {
          editor.gesture.strikeThroughAction = value as StrikeThroughAction
          editor.tool = CanvasTool.Write
          editor.writer.tool = CanvasWriteTool.Pencil
        },
      })
    }

    if (enabled("underline") && editor.configuration.recognition["raw-content"]?.gestures?.includes("underline")) {
      config.items.push({
        type: "select",
        id: `${idPrefix}-gesture-underline`,
        label: "On underline",
        options: underlineActionValues,
        getValue: (editor) => editor.gesture.underlineAction,
        setValue: (editor, value) => {
          editor.gesture.underlineAction = value as UnderlineAction
          editor.tool = CanvasTool.Write
          editor.writer.tool = CanvasWriteTool.Pencil
        },
      })
    }

    if (enabled("insert") && editor.configuration.recognition["raw-content"]?.gestures?.includes("insert")) {
      config.items.push({
        type: "select",
        id: `${idPrefix}-gesture-insert`,
        label: "On insert",
        options: splitActionValues,
        getValue: (editor) => editor.gesture.insertAction,
        setValue: (editor, value) => {
          editor.gesture.insertAction = value as InsertAction
          editor.tool = CanvasTool.Write
          editor.writer.tool = CanvasWriteTool.Pencil
        },
      })
    }

    super(config, editor)
  }
}
