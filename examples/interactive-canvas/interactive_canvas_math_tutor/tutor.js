// @ts-check
/**
 * The Math Tutor flow: which exercise is on the sheet, when the lines get judged, and moving on
 * once it is solved.
 */

import { connectionView } from "../../assets/js/connection.js"
import { LEVELS } from "./exercises.js"
import { judge } from "./judge.js"
import { linesFromJiix } from "../../assets/js/math/lines.js"
import { nextExercise } from "./playlist.js"
import { shapeSvg } from "./shapes.js"
import { UI } from "./strings.js"

/**
 * @typedef {import("./exercises.js").TExercise} TExercise
 * @typedef {import("./exercises.js").TLevel} TLevel
 * @typedef {import("../../assets/js/math/lines.js").TLine} TLine
 * @typedef {import("../../assets/js/math/lines.js").TJiix} TJiix
 * @typedef {import("./overlay.js").TutorOverlay} TutorOverlay
 * @typedef {import("./overlay.js").TKatex} TKatex
 * @typedef {{
 *   exportAs: (format: "jiix") => Promise<TJiix>,
 *   clear: () => Promise<unknown>,
 *   connectionState: TConnectionState,
 *   event: EventTarget & { addConnectionStateChangedListener: (callback: (state: TConnectionState) => void) => void },
 * }} TTutorCanvas
 * @typedef {import("../../assets/js/connection.js").TConnectionState} TConnectionState
 * @typedef {{
 *   rootElement: HTMLElement,
 *   statement: HTMLElement,
 *   prompt: HTMLElement,
 *   levels: HTMLElement,
 *   stars: HTMLElement,
 *   banner: HTMLElement,
 *   checkButton: HTMLButtonElement,
 *   nextButton: HTMLButtonElement,
 *   restartButton: HTMLButtonElement,
 *   connection: HTMLElement,
 *   notice: HTMLElement,
 * }} TTutorElements
 */

/**
 * How long the pen has to rest before the last line counts as finished. Long enough to think
 * between two digits: a shorter pause judged `x = 1` while `x = 12` was being written.
 */
export const PAUSE_MS = 2500

/**
 * Every exercise is written: the recognizer reads math only. With shapes on, a `0` can come back
 * as a circle and a `1` as a line.
 * Only scratch-out stays as gesture: a surround, strike-through or underline would turn a
 * student's `0`, fraction bar or `-` into an edit instead of ink.
 */
export const MATH_RECOGNITION = {
  "raw-content": {
    recognition: { types: ["math"] },
    classification: { types: ["math"] },
    gestures: ["scratch-out"],
  },
}

export class Tutor {
  /** @type {TTutorCanvas | undefined} */
  #canvas
  /** @type {TExercise | undefined} */
  #exercise
  /** @type {TLevel} */
  #level = "algebra-1"
  /** @type {Record<TLevel, number>} */
  #played = { "algebra-1": 0, "algebra-2": 0, "geometry-1": 0, "geometry-2": 0 }
  /** Ids of the exercises solved this session: solving one again after Start over counts once */
  #solvedIds = new Set()
  #solved = false
  /** @type {TLine[]} */
  #lines = []
  #finished = false
  #penDown = false
  /** No connection: what the sheet shows was recognized before it dropped, so nothing is judged */
  #hold = false
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #pauseTimer
  #renderQueue = Promise.resolve()
  /** Bumped on every new exercise: an export still in flight for the previous one is dropped */
  #generation = 0

  /**
   * @param {TTutorElements} elements
   * @param {TutorOverlay} overlay
   * @param {TKatex | undefined} katex
   */
  constructor(elements, overlay, katex) {
    this.elements = elements
    this.overlay = overlay
    this.katex = katex
    elements.rootElement.addEventListener("pointerdown", () => this.#onPenDown(), { capture: true })
    elements.rootElement.addEventListener("pointerup", () => this.#onPenUp(), { capture: true })
    elements.rootElement.addEventListener("pointercancel", () => this.#onPenUp(), { capture: true })
    elements.checkButton.addEventListener("click", () => this.#finish())
    elements.nextButton.addEventListener("click", () => this.#next())
    elements.restartButton.addEventListener("click", () => this.#load(this.#exercise))
    this.#renderLevels()
  }

  /** @param {TTutorCanvas} canvas */
  attach(canvas) {
    this.#canvas = canvas
    canvas.event.addEventListener("exported", () => this.#refresh())
    canvas.event.addConnectionStateChangedListener((state) => this.#onConnection(state))
    this.#onConnection(canvas.connectionState)
    this.#load(this.#exercise ?? nextExercise(this.#level, this.#played[this.#level]))
  }

  /** @param {TLevel} level */
  selectLevel(level) {
    this.#level = level
    this.#renderLevels()
    this.#load(nextExercise(level, this.#played[level]))
  }

  #onPenDown() {
    this.#penDown = true
    this.#finished = false
    clearTimeout(this.#pauseTimer)
  }

  #onPenUp() {
    this.#penDown = false
    this.#schedulePause()
  }

  /** The export of a stroke can land while the next one is drawn: the pause only runs pen up */
  #schedulePause() {
    clearTimeout(this.#pauseTimer)
    if (this.#penDown) return
    this.#pauseTimer = setTimeout(() => this.#finish(), PAUSE_MS)
  }

  /** @param {TConnectionState} state */
  #onConnection(state) {
    const view = connectionView(state)
    const wasHeld = this.#hold
    this.#hold = view.hold
    this.elements.connection.textContent = view.label
    this.elements.connection.dataset.tone = view.tone
    this.elements.notice.textContent = view.message ?? ""
    this.elements.notice.hidden = !view.message
    // Back online: the queued ink is replayed, the pause starts again to judge it once read
    if (wasHeld && !view.hold) this.#schedulePause()
  }

  #finish() {
    clearTimeout(this.#pauseTimer)
    if (this.#hold) return
    this.#finished = true
    this.#judge()
  }

  #refresh() {
    const generation = this.#generation
    this.#renderQueue = this.#renderQueue
      .then(async () => {
        const jiix = await this.#canvas?.exportAs("jiix")
        if (generation !== this.#generation) return
        this.#lines = linesFromJiix(jiix)
        // No pause re-armed here: it counts from the last pen up, not from when the server
        // answered. An export landing after the pause is judged as finished right away.
        this.#judge()
      })
      .catch((error) => console.error(error))
  }

  #judge() {
    const exercise = this.#exercise
    if (!exercise) return
    const options = { finished: this.#finished }
    const { marks, solved } = judge(this.#lines, exercise, options)
    this.overlay.render(marks)
    if (solved && !this.#solved) this.#onSolved()
  }

  #onSolved() {
    this.#solved = true
    if (this.#exercise) this.#solvedIds.add(this.#exercise.id)
    this.elements.stars.textContent = `★ ${UI.stars(this.#solvedIds.size)}`
    this.elements.banner.hidden = false
    this.elements.nextButton.classList.add("is-ready")
  }

  #next() {
    this.#played[this.#level]++
    this.#load(nextExercise(this.#level, this.#played[this.#level]))
  }

  /** @param {TExercise | undefined} exercise */
  async #load(exercise) {
    if (!exercise) return
    this.#generation++
    clearTimeout(this.#pauseTimer)
    this.#exercise = exercise
    this.#solved = false
    this.#finished = false
    this.#lines = []
    this.overlay.clear()
    this.elements.banner.hidden = true
    this.elements.nextButton.classList.remove("is-ready")
    this.#renderStatement(exercise)
    await this.#canvas?.clear()
  }

  /** @param {TExercise} exercise */
  #renderStatement(exercise) {
    this.elements.prompt.textContent = exercise.prompt
    if (exercise.kind === "measure") {
      this.elements.statement.replaceChildren(shapeSvg(exercise.shape))
      return
    }
    try {
      this.katex?.render(exercise.tex, this.elements.statement, { throwOnError: false, displayMode: true })
    } catch {
      this.elements.statement.textContent = exercise.tex
    }
  }

  /** One group per track, its levels numbered from 1 */
  #renderLevels() {
    const tracks = /** @type {const} */ (["algebra", "geometry"])
    this.elements.levels.replaceChildren(
      ...tracks.map((track) => {
        const group = document.createElement("div")
        group.className = "tutor-track"
        group.setAttribute("role", "group")
        group.setAttribute("aria-label", UI.tracks[track])
        const title = document.createElement("span")
        title.className = "tutor-track-title"
        title.textContent = UI.tracks[track]
        const levels = LEVELS.filter((entry) => entry.track === track)
        group.append(title, ...levels.map((entry) => this.#levelButton(entry.level, entry.number)))
        return group
      })
    )
  }

  /**
   * @param {TLevel} level
   * @param {number} number
   */
  #levelButton(level, number) {
    const button = document.createElement("button")
    button.className = `tutor-level${level === this.#level ? " is-active" : ""}`
    button.innerHTML = `<strong></strong><span></span>`
    button.querySelector("strong")?.append(UI.level(number))
    button.querySelector("span")?.append(UI.levelNames[level])
    button.addEventListener("click", () => this.selectLevel(level))
    return button
  }
}
