import {
  MatrixTransform,
  StrokeUtil,
  supportsRelativeTimestamps,
  toWireStroke,
  type TRecognitionStroke,
  type TWireStroke,
} from "@/iink"

/** Stroke origin used by the fixtures; the wire carries `creationTime + dt`, not `dt`. */
const CREATED_AT = 1700000000000

describe("StrokeSerializer.ts", () => {
  describe("toWireStroke", () => {
    // The expected payload is written out in full rather than derived from the input. Deriving it
    // would make the test agree with whatever the function does, which is the one thing it must not
    // do: this shape is the wire contract, and the server is what parses it.
    test("should produce exactly the payload the recognition API expects", () => {
      const stroke: TRecognitionStroke = {
        id: "stroke-1",
        creationTime: CREATED_AT,
        pointerType: "pen",
        pointers: [
          { x: 1, y: 2, dt: 1000, p: 0.5 },
          { x: 3, y: 4, dt: 1008, p: 0.6 },
          { x: 5, y: 6, dt: 1016, p: 0.7 },
        ],
      }

      expect(toWireStroke(stroke)).toEqual({
        id: "stroke-1",
        pointerType: "pen",
        p: [0.5, 0.6, 0.7],
        t: [CREATED_AT + 1000, CREATED_AT + 1008, CREATED_AT + 1016],
        x: [1, 3, 5],
        y: [2, 4, 6],
      })
    })

    test("should keep the four arrays index-aligned and in pointer order", () => {
      const stroke: TRecognitionStroke = {
        id: "stroke-2",
        creationTime: CREATED_AT,
        pointerType: "mouse",
        pointers: [
          { x: 10, y: 20, dt: 5, p: 1 },
          { x: 30, y: 40, dt: 6, p: 1 },
        ],
      }

      const wire = toWireStroke(stroke)
      // Every pointer here is timed and pressured, so both columns must be emitted.
      expect(wire.t).toBeDefined()
      expect(wire.p).toBeDefined()
      const t = wire.t as number[]
      const pressure = wire.p as number[]
      // Order carries meaning: the server reconstructs each pointer from the same index across the
      // four arrays, so a stable sort or a reversal anywhere would be silent corruption.
      wire.x.forEach((_, i) => {
        const source = stroke.pointers[i]
        // `t` on the wire is the absolute instant, so it is compared against the origin plus the
        // pointer's own offset - the pointer itself only ever carries the offset.
        expect({ x: wire.x[i], y: wire.y[i], t: t[i], p: pressure[i] }).toEqual({
          x: source.x,
          y: source.y,
          t: CREATED_AT + (source.dt as number),
          p: source.p,
        })
      })
    })

    test("should omit t when a pointer is not timed, and keep the geometry", () => {
      const wire = toWireStroke({
        id: "stroke-4",
        pointerType: "pen",
        pointers: [
          { x: 1, y: 2, p: 0.4 },
          { x: 3, y: 4, p: 0.5 },
        ],
      })

      expect(wire).toEqual({ id: "stroke-4", pointerType: "pen", x: [1, 3], y: [2, 4], p: [0.4, 0.5] })
      expect("t" in wire).toBe(false)
    })

    test("should omit p when pressure is absent", () => {
      const wire = toWireStroke({
        id: "stroke-5",
        creationTime: CREATED_AT,
        pointerType: "mouse",
        pointers: [
          { x: 1, y: 2, dt: 10 },
          { x: 3, y: 4, dt: 20 },
        ],
      })

      expect(wire).toEqual({
        id: "stroke-5",
        pointerType: "mouse",
        x: [1, 3],
        y: [2, 4],
        t: [CREATED_AT + 10, CREATED_AT + 20],
      })
      expect("p" in wire).toBe(false)
    })

    test("should send geometry alone when neither t nor p is supplied", () => {
      const wire = toWireStroke({
        id: "stroke-6",
        pointerType: "pen",
        pointers: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
        ],
      })

      expect(wire).toEqual({ id: "stroke-6", pointerType: "pen", x: [1, 3], y: [2, 4] })
    })

    test("should drop t entirely when only some pointers are timed", () => {
      // Half a timing column is worse than none: the server pairs each pointer with the same index
      // across the arrays, so a short `t` would attach the wrong timestamps to the wrong points.
      const wire = toWireStroke({
        id: "stroke-7",
        pointerType: "pen",
        pointers: [
          { x: 1, y: 2, dt: 10 },
          { x: 3, y: 4 },
          { x: 5, y: 6, dt: 30 },
        ],
      })

      expect(wire).toEqual({ id: "stroke-7", pointerType: "pen", x: [1, 3, 5], y: [2, 4, 6] })
      expect("t" in wire).toBe(false)
    })

    test("should omit t entirely when the stroke has no origin to make its times absolute", () => {
      // The wire carries absolute instants. With only offsets and nothing to anchor them, emitting
      // them raw would tell the server every stroke in the document began at the same moment —
      // destroying the very ordering it reads from them. Sending no column at all is the honest
      // reading, and the server falls back to its own default.
      const wire = toWireStroke({
        id: "stroke-untimed",
        pointerType: "pen",
        pointers: [
          { x: 1, y: 2, dt: 0, p: 1 },
          { x: 3, y: 4, dt: 12, p: 1 },
        ],
      })
      expect(wire.t).toBeUndefined()
      expect(wire.x).toEqual([1, 3])
    })

    test("should return empty arrays for a stroke with no pointers", () => {
      expect(toWireStroke({ id: "stroke-3", pointerType: "pen", pointers: [] })).toEqual({
        id: "stroke-3",
        pointerType: "pen",
        x: [],
        y: [],
      })
    })

    test("should accept a TStroke from the symbol layer without conversion", () => {
      // The point of declaring `TRecognitionStroke` inside the client rather than importing the
      // symbol layer's type: structural typing makes a real `TStroke` a valid argument, so neither
      // package needs to know about the other.
      const stroke = StrokeUtil.createEmpty(undefined, "pen", CREATED_AT)
      // The pressure reaches the wire exactly as the device reported it. `addPointer` used to
      // overwrite it with a value derived from the gap to the previous pointer; width is a drawing
      // decision now, taken at render time, and never written back into the document.
      StrokeUtil.addPointer(stroke, { x: 7, y: 8, dt: 42, p: 0.25 })

      const wire: TWireStroke = toWireStroke(stroke)
      expect(wire).toEqual({
        id: stroke.id,
        pointerType: "pen",
        p: [0.25],
        t: [CREATED_AT + 42],
        x: [7],
        y: [8],
      })
    })

    describe("with a transform", () => {
      // Every expected coordinate below is computed by hand from the matrix's definition, never by
      // calling the library — a test that ran the code to build its own expectation would agree with
      // whatever the code does, including a wrong convention (that is exactly how this exact test
      // shipped a Critical earlier in this epic).

      test("bakes a translation into the coordinates and leaves t/p untouched", () => {
        const stroke: TRecognitionStroke = {
          id: "stroke-8",
          creationTime: CREATED_AT,
          pointerType: "pen",
          pointers: [
            { x: 0, y: 0, dt: 0, p: 1 },
            { x: 10, y: 0, dt: 1, p: 1 },
          ],
          // translate(100, 200): x' = x + 100, y' = y + 200, by hand.
          transform: MatrixTransform.identity().translate(100, 200),
        }

        expect(toWireStroke(stroke)).toEqual({
          id: "stroke-8",
          pointerType: "pen",
          x: [100, 110],
          y: [200, 200],
          t: [CREATED_AT, CREATED_AT + 1],
          p: [1, 1],
        })
      })

      test("bakes a rotation into the coordinates", () => {
        // rotate(pi/2) with no center: MatrixTransform.rotate rounds cos/sin to 3 decimals before
        // multiplying, so cos(pi/2) lands on 0 and sin(pi/2) on 1 exactly, giving the matrix
        // { xx: 0, yx: 1, xy: -1, yy: 0, tx: 0, ty: 0 } — i.e. x' = -y, y' = x, by hand.
        const stroke: TRecognitionStroke = {
          id: "stroke-9",
          pointerType: "pen",
          pointers: [
            { x: 5, y: 0 },
            { x: 0, y: 5 },
          ],
          transform: MatrixTransform.identity().rotate(Math.PI / 2),
        }

        expect(toWireStroke(stroke)).toEqual({
          id: "stroke-9",
          pointerType: "pen",
          x: [0, -5],
          y: [5, 0],
        })
      })

      test("does not give a never-timed, never-pressured pointer a t or p", () => {
        const stroke: TRecognitionStroke = {
          id: "stroke-10",
          pointerType: "pen",
          // scale(2, 3): x' = 2x, y' = 3y, by hand.
          pointers: [
            { x: 3, y: 4 },
            { x: 1, y: -1 },
          ],
          transform: MatrixTransform.identity().scale(2, 3),
        }

        const wire = toWireStroke(stroke)
        expect(wire).toEqual({ id: "stroke-10", pointerType: "pen", x: [6, 2], y: [12, -3] })
        expect("t" in wire).toBe(false)
        expect("p" in wire).toBe(false)
      })

      test("treats an explicit identity transform the same as no transform at all", () => {
        const stroke: TRecognitionStroke = {
          id: "stroke-11",
          creationTime: CREATED_AT,
          pointerType: "pen",
          pointers: [{ x: 1, y: 2, dt: 10, p: 0.5 }],
          transform: MatrixTransform.identity(),
        }

        expect(toWireStroke(stroke)).toEqual({
          id: "stroke-11",
          pointerType: "pen",
          x: [1],
          y: [2],
          t: [CREATED_AT + 10],
          p: [0.5],
        })
      })

      test("rounds a transformed coordinate to three decimals", () => {
        // rotate(pi/3) with no center: cos(pi/3) and sin(pi/3) round to 0.5 and 0.866 respectively
        // before the multiply (MatrixTransform.rotate's own rounding), giving the matrix
        // { xx: 0.5, yx: 0.866, xy: -0.866, yy: 0.5, tx: 0, ty: 0 }.
        // x' = 0.5*1 + -0.866*1 = -0.366; y' = 0.866*1 + 0.5*1 = 1.366 — both already three decimals,
        // so applyMatrixToPoint's rounding is a no-op here and the raw multiply result is exact.
        const stroke: TRecognitionStroke = {
          id: "stroke-12",
          pointerType: "pen",
          pointers: [{ x: 1, y: 1 }],
          transform: MatrixTransform.identity().rotate(Math.PI / 3),
        }

        expect(toWireStroke(stroke)).toEqual({
          id: "stroke-12",
          pointerType: "pen",
          x: [-0.366],
          y: [1.366],
        })
      })
    })

    describe("with relative timestamps", () => {
      // Servers from 4.6.0 read `t0` (first pointer, absolute) and `dt` (offsets from it) instead of
      // `t`, which shrinks every stroke sent. They rebuild `t0 + dt`, so the instants must be the same.
      const relative = { relativeTimestamps: true }

      test("should send t0 and dt instead of t", () => {
        const stroke: TRecognitionStroke = {
          id: "stroke-1",
          creationTime: CREATED_AT,
          pointerType: "pen",
          pointers: [
            { x: 1, y: 2, dt: 1000, p: 0.5 },
            { x: 3, y: 4, dt: 1008, p: 0.6 },
            { x: 5, y: 6, dt: 1016, p: 0.7 },
          ],
        }

        expect(toWireStroke(stroke, relative)).toEqual({
          id: "stroke-1",
          pointerType: "pen",
          p: [0.5, 0.6, 0.7],
          t0: CREATED_AT + 1000,
          dt: [0, 8, 16],
          x: [1, 3, 5],
          y: [2, 4, 6],
        })
      })

      test("should round t0 and dt to whole milliseconds, the server reading them as integers", () => {
        const wire = toWireStroke(
          {
            id: "stroke-fraction",
            creationTime: CREATED_AT + 0.4,
            pointerType: "pen",
            pointers: [
              { x: 1, y: 2, dt: 0 },
              { x: 3, y: 4, dt: 7.6 },
            ],
          },
          relative
        )

        expect(wire.t0).toBe(CREATED_AT)
        expect(wire.dt).toEqual([0, 8])
      })

      test("should send neither t0 nor dt when a pointer is not timed", () => {
        const wire = toWireStroke(
          {
            id: "stroke-7",
            creationTime: CREATED_AT,
            pointerType: "pen",
            pointers: [
              { x: 1, y: 2, dt: 10 },
              { x: 3, y: 4 },
            ],
          },
          relative
        )

        expect(wire).toEqual({ id: "stroke-7", pointerType: "pen", x: [1, 3], y: [2, 4] })
      })

      test("should send neither t0 nor dt when the stroke has no origin", () => {
        const wire = toWireStroke(
          {
            id: "stroke-untimed",
            pointerType: "pen",
            pointers: [
              { x: 1, y: 2, dt: 0 },
              { x: 3, y: 4, dt: 12 },
            ],
          },
          relative
        )

        expect(wire).toEqual({ id: "stroke-untimed", pointerType: "pen", x: [1, 3], y: [2, 4] })
      })
    })
  })

  describe("supportsRelativeTimestamps", () => {
    test("should be true from server 4.6.0", () => {
      expect(supportsRelativeTimestamps("4.6.0")).toBe(true)
      expect(supportsRelativeTimestamps("4.10.1")).toBe(true)
      expect(supportsRelativeTimestamps("5.0.0")).toBe(true)
    })

    test("should be false before 4.6.0, or when the version is not known yet", () => {
      expect(supportsRelativeTimestamps("4.5.4")).toBe(false)
      expect(supportsRelativeTimestamps("3.1.3")).toBe(false)
      expect(supportsRelativeTimestamps(undefined)).toBe(false)
    })
  })
})
