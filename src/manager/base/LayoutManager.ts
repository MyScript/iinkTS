import type { CanvasLayer } from "@/canvas"
import type { TPartialDeep } from "@/core"
import { DOMFactory } from "@/dom"
import { LoggerCategory, LoggerManager } from "@/logger"

/**
 * @group Manager
 * @summary The places of the canvas UI where menus and other occupants sit; the center belongs to the ink
 */
export const LAYOUT_SLOTS = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const

/**
 * @group Manager
 */
export type TLayoutSlot = (typeof LAYOUT_SLOTS)[number]

/**
 * @group Manager
 * @summary The axis of a menu's bar
 */
export type TMenuOrientation = "horizontal" | "vertical"

/**
 * @group Manager
 * @summary The side a menu's dropdowns open towards
 */
export type TMenuDirection = "up" | "down" | "left" | "right"

/**
 * @group Manager
 * @summary The axis a slot gives its menus: vertical bars on the sides, horizontal ones at the top and bottom
 */
export function slotOrientation(slot: TLayoutSlot): TMenuOrientation {
  return slot.startsWith("middle") ? "vertical" : "horizontal"
}

/**
 * @group Manager
 * @summary The side a slot's menus open towards: away from the edge they sit on
 */
export function slotOpenTowards(slot: TLayoutSlot): TMenuDirection {
  if (slot.startsWith("top")) {
    return "down"
  }
  if (slot.startsWith("bottom")) {
    return "up"
  }
  return slot === "middle-left" ? "right" : "left"
}

/**
 * @group Manager
 * @summary The horizontal side a slot sits against, which a dropdown grows away from
 */
export function slotAnchor(slot: TLayoutSlot): "start" | "center" | "end" {
  if (slot.endsWith("left")) {
    return "start"
  }
  return slot.endsWith("right") ? "end" : "center"
}

/**
 * @group Manager
 * @summary What goes in each slot, in stacking order
 * @remarks A slot given here replaces the default one. An occupant it leaves out keeps its default slot;
 * one listed twice only shows in the first.
 * @example
 * // Undo/redo of the action bar right above the tools
 * { "bottom-center": ["action", "tool"] }
 */
export type TLayoutConfiguration = Partial<Record<TLayoutSlot, string[]>>

/**
 * @group Manager
 * @summary Where each occupant sits when the configuration does not say
 */
export const DefaultLayoutConfiguration: Readonly<TLayoutConfiguration> = {
  "top-left": ["action"],
  "top-right": ["style"],
  "bottom-center": ["tool"],
  "bottom-left": ["state"],
  "bottom-right": ["minimap"],
}

/** The configured slots as given in the canvas options, whose partial typing allows holes in the arrays */
function readLayoutConfiguration(configuration?: TPartialDeep<TLayoutConfiguration>): TLayoutConfiguration {
  const read: TLayoutConfiguration = {}
  LAYOUT_SLOTS.forEach((slot) => {
    const occupants = configuration?.[slot]
    if (occupants) {
      read[slot] = occupants.filter((occupant): occupant is string => typeof occupant === "string")
    }
  })
  return read
}

/**
 * @group Manager
 * @summary What a custom occupant's factory knows of its slot, to fit it
 */
export type TLayoutOccupantContext = {
  slot: TLayoutSlot
  orientation: TMenuOrientation
  openTowards: TMenuDirection
}

/**
 * @group Manager
 * @summary Builds a custom occupant's element each time it is placed, so it can fit its slot
 */
export type TLayoutOccupantFactory<TCanvas> = (canvas: TCanvas, context: TLayoutOccupantContext) => HTMLElement

/**
 * @group Manager
 * @summary Where a custom occupant goes when the layout table does not place it already
 */
export type TLayoutOccupantOptions = {
  /** Added to this slot of the table; without it, only the table can place the occupant */
  slot?: TLayoutSlot
  /** Placed before this occupant of the slot */
  before?: string
  /** Placed after this occupant of the slot */
  after?: string
}

/**
 * @group Manager
 * @summary A custom occupant declared at load, in `options.extend.layout`
 */
export type TLayoutOccupant<TCanvas> = TLayoutOccupantOptions & {
  key: string
  factory: TLayoutOccupantFactory<TCanvas>
}

/**
 * @group Manager
 * @summary Places the canvas UI occupants (menus, connection state, minimap, custom ones) in the slots of the layout
 * @remarks Each occupant gets a host element in its slot, in table order: it renders into that host, so the order
 * holds whatever order the occupants render in. When the layout changes, the hosts move with their content; an
 * occupant that changes slot is announced (see {@link onOccupantMoved}) so it can rebuild for its new slot.
 */
export class LayoutManager<TCanvas = unknown> {
  protected logger = LoggerManager.getLogger(LoggerCategory.CANVAS)
  layers: CanvasLayer
  /** The canvas custom occupants' factories receive */
  canvas?: TCanvas
  /** The slots as configured, before the defaults fill the rest */
  configuration: TLayoutConfiguration
  /** The built-in occupants of this canvas; a name outside of them and of the registered ones is ignored */
  occupants: readonly string[]

  /** Where each occupant sits, resolved from the configuration and the defaults */
  protected placement: Record<TLayoutSlot, string[]>
  protected slots: Partial<Record<TLayoutSlot, HTMLDivElement>> = {}
  protected hosts: Map<string, HTMLDivElement> = new Map()
  /** Custom occupants, by key */
  protected registered: Map<string, TLayoutOccupantFactory<TCanvas>> = new Map()
  protected moveListeners: ((occupant: string, slot: TLayoutSlot | undefined) => void)[] = []
  protected rendered = false

  constructor(
    layers: CanvasLayer,
    occupants: readonly string[],
    configuration?: TPartialDeep<TLayoutConfiguration>,
    canvas?: TCanvas,
    registered: readonly TLayoutOccupant<TCanvas>[] = []
  ) {
    this.layers = layers
    this.occupants = occupants
    this.canvas = canvas
    this.configuration = readLayoutConfiguration(configuration)
    registered.forEach(({ key, factory, ...options }) => this.register(key, factory, options))
    this.placement = this.resolve()
  }

  /** Whether the slots are in the page */
  get isRendered(): boolean {
    return this.rendered
  }

  /** The occupants of each slot: the configured slots as given, the others from the defaults minus what moved */
  protected resolve(): Record<TLayoutSlot, string[]> {
    const placed = new Set<string>()
    const configured = this.readConfiguredSlots(placed)
    const placement: Record<TLayoutSlot, string[]> = {
      "top-left": [],
      "top-center": [],
      "top-right": [],
      "middle-left": [],
      "middle-right": [],
      "bottom-left": [],
      "bottom-center": [],
      "bottom-right": [],
    }
    LAYOUT_SLOTS.forEach((slot) => {
      placement[slot] =
        configured[slot] ??
        (DefaultLayoutConfiguration[slot] ?? []).filter((occupant) => this.isKnown(occupant) && !placed.has(occupant))
    })
    return placement
  }

  /** The slots the configuration gives, each occupant kept in the first slot naming it */
  protected readConfiguredSlots(placed: Set<string>): Partial<Record<TLayoutSlot, string[]>> {
    const configured: Partial<Record<TLayoutSlot, string[]>> = {}
    LAYOUT_SLOTS.forEach((slot) => {
      const occupants = this.configuration[slot]
      if (!occupants) {
        return
      }
      configured[slot] = occupants.filter((occupant) => {
        if (!this.isKnown(occupant)) {
          this.logger.warn("layout", `No "${occupant}" in this canvas: ignored in "${slot}"`)
          return false
        }
        if (placed.has(occupant)) {
          this.logger.warn("layout", `"${occupant}" is already placed: ignored in "${slot}"`)
          return false
        }
        placed.add(occupant)
        return true
      })
    })
    return configured
  }

  protected isKnown(occupant: string): boolean {
    return this.occupants.includes(occupant) || this.registered.has(occupant)
  }

  /** The occupants of a slot, in stacking order */
  occupantsOf(slot: TLayoutSlot): readonly string[] {
    return this.placement[slot]
  }

  /** The slot an occupant sits in */
  slotOf(occupant: string): TLayoutSlot | undefined {
    return LAYOUT_SLOTS.find((slot) => this.placement[slot].includes(occupant))
  }

  /** Calls `listener` with each occupant a layout change moved to another slot (undefined: placed nowhere now) */
  onOccupantMoved(listener: (occupant: string, slot: TLayoutSlot | undefined) => void): void {
    this.moveListeners.push(listener)
  }

  /**
   * Replaces the slots given, as at load: an occupant left out keeps its slot, one moved elsewhere leaves its default.
   * @example
   * canvas.layout.set({ "bottom-center": ["action", "tool"] })
   */
  set(configuration: TLayoutConfiguration): void {
    const given = LAYOUT_SLOTS.filter((slot) => configuration[slot])
    const moved = new Set(given.flatMap((slot) => configuration[slot] ?? []))
    LAYOUT_SLOTS.forEach((slot) => {
      const occupants = configuration[slot]
      if (occupants) {
        this.configuration[slot] = [...occupants]
      } else {
        // Named in a given slot, an occupant leaves the one the table had it in
        this.configuration[slot] = this.configuration[slot]?.filter((occupant) => !moved.has(occupant))
      }
    })
    this.relayout()
  }

  /**
   * Adds a custom occupant, built by `factory` each time it is placed; `options.slot` adds it to the table.
   * @throws when `key` is already an occupant of this canvas
   */
  add(key: string, factory: TLayoutOccupantFactory<TCanvas>, options?: TLayoutOccupantOptions): void {
    this.register(key, factory, options)
    this.relayout()
    if (!this.slotOf(key)) {
      this.logger.warn("layout", `"${key}" is not placed in any slot: not shown`)
    }
  }

  /** Removes a custom occupant added by {@link add}; false when there was none under that key */
  remove(key: string): boolean {
    if (!this.registered.delete(key)) {
      return false
    }
    LAYOUT_SLOTS.forEach((slot) => {
      this.configuration[slot] = this.configuration[slot]?.filter((occupant) => occupant !== key)
    })
    this.relayout()
    return true
  }

  protected register(key: string, factory: TLayoutOccupantFactory<TCanvas>, options?: TLayoutOccupantOptions): void {
    if (this.isKnown(key)) {
      throw new Error(`"${key}" is already an occupant of the layout`)
    }
    this.registered.set(key, factory)
    if (options?.slot && !LAYOUT_SLOTS.some((slot) => this.configuration[slot]?.includes(key))) {
      this.insertInTable(key, options.slot, options)
    }
  }

  /** Adds `key` to the table's `slot`, next to `before`/`after` when that occupant is in it, else at its end */
  protected insertInTable(key: string, slot: TLayoutSlot, { before, after }: TLayoutOccupantOptions): void {
    const occupants = [...(this.configuration[slot] ?? this.resolve()[slot])]
    const reference = before ?? after
    const index = reference ? occupants.indexOf(reference) : -1
    if (index < 0) {
      occupants.push(key)
    } else {
      occupants.splice(before ? index : index + 1, 0, key)
    }
    this.configuration[slot] = occupants
  }

  /** Resolves the placement again and, once rendered, moves the hosts and announces who changed slot */
  protected relayout(): void {
    const previous = new Map<string, TLayoutSlot | undefined>()
    ;[...this.occupants, ...this.registered.keys()].forEach((occupant) => previous.set(occupant, this.slotOf(occupant)))
    this.placement = this.resolve()
    if (!this.rendered) {
      return
    }
    this.renderSlots()
    previous.forEach((slot, occupant) => {
      const now = this.slotOf(occupant)
      if (now !== slot) {
        this.renderRegistered(occupant)
        this.moveListeners.forEach((listener) => listener(occupant, now))
      }
    })
  }

  /** Builds the slots holding occupants, with a host per occupant, and moves the connection state into its own */
  render(): void {
    this.rendered = true
    this.renderSlots()
    this.registered.forEach((_factory, key) => this.renderRegistered(key))
  }

  /** (Re)builds the slot containers, keeping each occupant's host — and so its content — across layouts */
  protected renderSlots(): void {
    Object.values(this.slots).forEach((slot) => slot.remove())
    this.slots = {}
    const placed = new Set<string>()
    LAYOUT_SLOTS.forEach((slot) => {
      const occupants = this.placement[slot]
      if (occupants.length === 0) {
        return
      }
      const container = DOMFactory.div({ className: ["ms-layout-slot", `ms-layout-${slot}`] })
      occupants.forEach((occupant) => {
        const host =
          this.hosts.get(occupant) ?? DOMFactory.div({ className: ["ms-layout-host", `ms-layout-host-${occupant}`] })
        this.hosts.set(occupant, host)
        container.appendChild(host)
        placed.add(occupant)
      })
      this.slots[slot] = container
      this.layers.ui.root.appendChild(container)
    })
    this.hosts.forEach((host, occupant) => {
      if (!placed.has(occupant)) {
        host.remove()
        this.hosts.delete(occupant)
      }
    })
    this.host("state")?.appendChild(this.layers.ui.state.root)
  }

  /** Builds a custom occupant's element for its current slot; a factory that throws is logged, the rest renders */
  protected renderRegistered(key: string): void {
    const factory = this.registered.get(key)
    const slot = this.slotOf(key)
    const host = this.host(key)
    if (!factory) {
      return
    }
    if (!slot || !host) {
      this.logger.warn("layout", `"${key}" is not placed in any slot: not shown`)
      return
    }
    if (!this.canvas) {
      this.logger.error("layout", `"${key}" has no canvas to build with`)
      return
    }
    try {
      const context = { slot, orientation: slotOrientation(slot), openTowards: slotOpenTowards(slot) }
      host.replaceChildren(factory(this.canvas, context))
    } catch (error) {
      this.logger.error("layout", `Failed to build "${key}"`, error)
    }
  }

  /** The element an occupant renders into; undefined before render() or for an occupant placed nowhere */
  host(occupant: string): HTMLElement | undefined {
    return this.hosts.get(occupant)
  }

  destroy(): void {
    Object.values(this.slots).forEach((slot) => slot.remove())
    this.slots = {}
    this.hosts.clear()
    this.moveListeners = []
    this.rendered = false
  }
}
