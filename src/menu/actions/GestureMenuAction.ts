import type { TInteractiveInkCanvas } from "@/canvas"
import type { TRecognitionGesture } from "@/client"
import {
  CanvasTool,
  CanvasWriteTool,
  InsertAction,
  JoinAction,
  StrikeThroughAction,
  SurroundAction,
  UnderlineAction,
} from "@/manager"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

/** @group Menu */
export type TGestureActionItemsConfig = {
  detect?: boolean
  surround?: boolean
  strikethrough?: boolean
  underline?: boolean
  insert?: boolean
  join?: boolean
  scratchOut?: boolean
}
/** @group Menu */
export type TGestureActionConfig = boolean | TGestureActionItemsConfig

type TGestureAction = {
  values: Record<string, string>
  get: (canvas: TInteractiveInkCanvas) => string
  set: (canvas: TInteractiveInkCanvas, value: string) => void
}

type TGestureSubMenuOptions = {
  key: Exclude<keyof TGestureActionItemsConfig, "detect">
  gestureType: TRecognitionGesture
  label: string
  /** Absent for a gesture with a single behavior: its submenu only turns it on or off. */
  action?: TGestureAction
}

/**
 * @group Menu
 * @remarks Menu action Gesture - Détection et actions de gestes
 */
export class GestureMenuAction extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TGestureActionItemsConfig) {
    const enabled = (key: keyof TGestureActionItemsConfig) => itemsConfig?.[key] !== false
    const isGestureEnabled = (canvas: TInteractiveInkCanvas, gestureType: TRecognitionGesture) =>
      canvas.configuration.recognition["raw-content"]?.gestures?.includes(gestureType) ?? false
    const resetToPencil = (canvas: TInteractiveInkCanvas) => {
      canvas.tool = CanvasTool.Write
      canvas.writer.tool = CanvasWriteTool.Pencil
    }

    const setGestureEnabled = (canvas: TInteractiveInkCanvas, gestureType: TRecognitionGesture, value: boolean) => {
      const conf = structuredClone(canvas.configuration.recognition)
      const gestures = (conf["raw-content"].gestures ?? []).filter((g) => g !== gestureType)
      conf["raw-content"].gestures = value ? [...gestures, gestureType] : gestures
      canvas.updateRecognitionConfiguration(conf)
    }

    const buildActionSelect = (
      options: TGestureSubMenuOptions,
      action: TGestureAction
    ): TMenuSubMenu["items"][number] => ({
      type: "select",
      id: `${idPrefix}-gesture-${options.key}`,
      label: "Action on detection",
      options: Object.entries(action.values).map(([label, value]) => ({ label, value })),
      getValue: action.get,
      setValue: (canvas, value) => {
        action.set(canvas, value)
        resetToPencil(canvas)
      },
      disabled: (canvas) => !isGestureEnabled(canvas, options.gestureType),
    })

    const buildGestureSubMenu = (options: TGestureSubMenuOptions): TMenuSubMenu => ({
      type: "submenu",
      id: `${idPrefix}-gesture-${options.key}-menu`,
      label: options.label,
      menuTitle: options.label,
      position: "right-top",
      items: [
        {
          type: "checkbox",
          id: `${idPrefix}-gesture-${options.key}-enable`,
          label: "Enable",
          getValue: (canvas) => isGestureEnabled(canvas, options.gestureType),
          setValue: (canvas, value) => setGestureEnabled(canvas, options.gestureType, value),
        },
        ...(options.action ? [buildActionSelect(options, options.action)] : []),
      ],
    })

    const gestureSubMenus: TGestureSubMenuOptions[] = [
      {
        key: "scratchOut",
        gestureType: "scratch-out",
        label: "Scratch-out",
      },
      {
        key: "surround",
        gestureType: "surround",
        label: "Surround",
        action: {
          values: SurroundAction,
          get: (canvas) => canvas.gesture.surroundAction,
          set: (canvas, value) => (canvas.gesture.surroundAction = value as SurroundAction),
        },
      },
      {
        key: "strikethrough",
        gestureType: "strike-through",
        label: "Strikethrough",
        action: {
          values: StrikeThroughAction,
          get: (canvas) => canvas.gesture.strikeThroughAction,
          set: (canvas, value) => (canvas.gesture.strikeThroughAction = value as StrikeThroughAction),
        },
      },
      {
        key: "underline",
        gestureType: "underline",
        label: "Underline",
        action: {
          values: UnderlineAction,
          get: (canvas) => canvas.gesture.underlineAction,
          set: (canvas, value) => (canvas.gesture.underlineAction = value as UnderlineAction),
        },
      },
      {
        key: "insert",
        gestureType: "insert",
        label: "Insert",
        action: {
          values: InsertAction,
          get: (canvas) => canvas.gesture.insertAction,
          set: (canvas, value) => (canvas.gesture.insertAction = value as InsertAction),
        },
      },
      {
        key: "join",
        gestureType: "join",
        label: "Join",
        action: {
          values: JoinAction,
          get: (canvas) => canvas.gesture.joinAction,
          set: (canvas, value) => (canvas.gesture.joinAction = value as JoinAction),
        },
      },
    ]

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-gesture`,
      label: "Gesture",
      menuTitle: "Gesture",
      position: "right-top",
      items: [],
    }

    if (enabled("detect")) {
      config.items.push({
        type: "checkbox",
        id: `${idPrefix}-gesture-detect`,
        label: "Detect gesture",
        getValue: (canvas) => canvas.writer.detectGesture,
        setValue: (canvas, value) => {
          canvas.writer.detectGesture = value
          resetToPencil(canvas)
        },
      })
    }

    gestureSubMenus
      .filter((options) => enabled(options.key) && isGestureEnabled(canvas, options.gestureType))
      .forEach((options) => config.items.push(buildGestureSubMenu(options)))

    super(config, canvas)
  }
}
