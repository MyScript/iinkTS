import type { TInteractiveInkCanvas } from "@/canvas"
import { DEFAULT_PEN_NIB, isPenNib, PEN_NIBS } from "@/style"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

/** @group Menu */
export type TPenActionItemsConfig = {
  angle?: boolean
  smoothing?: boolean
  speed?: boolean
}
/** @group Menu */
export type TPenActionConfig = boolean | TPenActionItemsConfig

/** The nib currently on the pen, falling back to the default when the style names none. */
function currentNib(canvas: TInteractiveInkCanvas) {
  return isPenNib(canvas.penStyle.pen) ? canvas.penStyle.pen : DEFAULT_PEN_NIB
}

/** Reads a tunable off the pen style, falling back to the current nib's own value. */
function readSetting(canvas: TInteractiveInkCanvas, key: string, fallback: number): number {
  const value = canvas.penStyle[key]
  return typeof value === "number" ? value : fallback
}

const ANGLES = [0, 15, 30, 45, 60, 75, 90]
const SMOOTHINGS = [0, 1, 2, 3, 4, 6]
const SPEEDS = [0, 0.5, 0.9, 1.6, 2.4]

/**
 * @group Menu
 * @remarks Menu action Pen — tunes the nib the pen currently carries
 *
 * Every setting is written onto the pen style, so it travels with each stroke drawn afterwards and
 * leaves what is already on the canvas alone. That is what makes two settings comparable: draw with
 * one, change it, draw again, and both are on screen at once.
 *
 * An item that the current nib does not read is disabled rather than hidden — which nib answers to
 * which setting is itself worth showing.
 */
export class PenMenuAction extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TPenActionItemsConfig) {
    const enabled = (key: keyof TPenActionItemsConfig) => itemsConfig?.[key] !== false

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-pen`,
      label: "Pen",
      menuTitle: "Pen",
      position: "right-top",
      items: [],
    }

    if (enabled("angle")) {
      config.items.push({
        type: "select",
        id: `${idPrefix}-pen-angle`,
        label: "Nib angle",
        // Only a broad edge reads it: for every other nib the angle of the tip is not what decides
        // how wide the line comes out.
        disabled: (c: TInteractiveInkCanvas) => PEN_NIBS[currentNib(c)].edgeAngle === undefined,
        options: ANGLES.map((deg) => ({ label: `${deg}°`, value: String(deg) })),
        getValue: (c: TInteractiveInkCanvas) => {
          const own = PEN_NIBS[currentNib(c)].edgeAngle ?? 0
          return String(Math.round(readSetting(c, "penAngle", (own * 180) / Math.PI)))
        },
        setValue: (c: TInteractiveInkCanvas, value: string) => {
          c.penStyle = { penAngle: Number(value) }
        },
      })
    }

    if (enabled("smoothing")) {
      config.items.push({
        type: "select",
        id: `${idPrefix}-pen-smoothing`,
        label: "Smoothing",
        options: SMOOTHINGS.map((n) => ({ label: n === 0 ? "none" : String(n), value: String(n) })),
        getValue: (c: TInteractiveInkCanvas) =>
          String(readSetting(c, "penSmoothing", PEN_NIBS[currentNib(c)].smoothing ?? 0)),
        setValue: (c: TInteractiveInkCanvas, value: string) => {
          c.penStyle = { penSmoothing: Number(value) }
        },
      })
    }

    if (enabled("speed")) {
      config.items.push({
        type: "select",
        id: `${idPrefix}-pen-speed`,
        label: "Speed response",
        // A broad edge answers to direction and a ballpoint to nothing, so neither reads this.
        disabled: (c: TInteractiveInkCanvas) => {
          const nib = PEN_NIBS[currentNib(c)]
          return nib.edgeAngle !== undefined || nib.speed === 0
        },
        options: SPEEDS.map((n) => ({ label: n === 0 ? "none" : n.toFixed(1), value: String(n) })),
        getValue: (c: TInteractiveInkCanvas) => String(readSetting(c, "penSpeed", PEN_NIBS[currentNib(c)].speed)),
        setValue: (c: TInteractiveInkCanvas, value: string) => {
          c.penStyle = { penSpeed: Number(value) }
        },
      })
    }

    super(config, canvas)
  }
}
