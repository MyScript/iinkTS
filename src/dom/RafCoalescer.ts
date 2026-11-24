/**
 * Coalesces repeated `schedule()` calls to at most one `requestAnimationFrame` callback —
 * fast pointer/wheel/mutation-driven code paths otherwise fire far more often than a single
 * frame can render. Each `schedule()` call replaces the pending callback, so the one that
 * actually runs always sees whatever state the caller captured (or reads live) last.
 * @group DOM
 */
export class RafCoalescer {
  #frame?: number
  #pending?: () => void

  schedule(callback: () => void): void {
    this.#pending = callback
    if (this.#frame !== undefined) {
      return
    }
    this.#frame = requestAnimationFrame(() => {
      this.#frame = undefined
      const run = this.#pending
      this.#pending = undefined
      run?.()
    })
  }

  cancel(): void {
    if (this.#frame !== undefined) {
      cancelAnimationFrame(this.#frame)
      this.#frame = undefined
    }
    this.#pending = undefined
  }
}
